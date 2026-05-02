export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { extractText } from "unpdf";

import { model as geminiModel } from "@/lib/gemini";
import {
  buildJDMatchPrompt,
  callGeminiWithFallback,
} from "@/lib/resumeAnalysis";

type JDMatchAIResponse = {
  matchScore: number;
  missingSkills: string[];
  resumeSkills: string[];
  jdSkills: string[];
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

async function extractTextFromFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (file.type === "application/pdf") {
    const uint8Array = new Uint8Array(bytes);
    const { text } = await extractText(uint8Array, { mergePages: true });
    return text;
  }

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (file.type === "text/plain") {
    return buffer.toString("utf-8");
  }

  return "";
}

function validateFile(file: File, label: string) {
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `${label} file size exceeds 5MB limit` },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `${label} must be a PDF, DOCX, or TXT file` },
      { status: 400 },
    );
  }

  return null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const resume = formData.get("resume") as File | null;
    const jd = formData.get("jd") as File | null;
    const jdTextInput = formData.get("jdText");
    const pastedJDText =
      typeof jdTextInput === "string" ? jdTextInput.trim() : "";

    if (!resume) {
      return NextResponse.json(
        { error: "No resume uploaded" },
        { status: 400 },
      );
    }

    if (!jd && !pastedJDText) {
      return NextResponse.json(
        { error: "Please upload a JD file or paste the job description text" },
        { status: 400 },
      );
    }

    const resumeValidationError = validateFile(resume, "Resume");

    if (resumeValidationError) {
      return resumeValidationError;
    }

    if (jd) {
      const jdValidationError = validateFile(jd, "Job description");

      if (jdValidationError) {
        return jdValidationError;
      }
    }

    let resumeText = "";
    let jdText = pastedJDText;

    try {
      resumeText = await extractTextFromFile(resume);

      if (jd) {
        jdText = await extractTextFromFile(jd);
      }
    } catch (extractError: any) {
      return NextResponse.json(
        {
          error: "Failed to extract text from uploaded file",
          message: extractError?.message || "Unknown extraction error",
        },
        { status: 400 },
      );
    }

    resumeText = resumeText.trim();
    jdText = jdText.trim();

    if (!resumeText) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from resume. The file might be empty or corrupted.",
        },
        { status: 400 },
      );
    }

    if (!jdText) {
      return NextResponse.json(
        {
          error:
            "Could not extract job description text. Please upload a valid JD file or paste the JD text.",
        },
        { status: 400 },
      );
    }

    if (resumeText.length < 50) {
      return NextResponse.json(
        {
          error:
            "Resume text is too short. Please upload a valid resume with sufficient content.",
        },
        { status: 400 },
      );
    }

    if (jdText.length < 30) {
      return NextResponse.json(
        {
          error:
            "Job description text is too short. Please provide sufficient JD content.",
        },
        { status: 400 },
      );
    }

    const prompt = buildJDMatchPrompt(resumeText, jdText);
    let responseText: string;

    try {
      responseText = await callGeminiWithFallback(prompt, geminiModel);
    } catch (geminiError: any) {
      const isRateLimitError =
        geminiError?.message?.includes("429") ||
        geminiError?.message?.includes("quota") ||
        geminiError?.message?.includes("rate limit");

      if (isRateLimitError) {
        return NextResponse.json(
          {
            error: "API quota exceeded",
            message:
              "We're experiencing high demand. Please try again in a few minutes.",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          error: "AI service is currently unavailable",
          message:
            geminiError?.message ||
            "Failed to match resume with job description. Please try again later.",
        },
        { status: 503 },
      );
    }

    if (!responseText) {
      return NextResponse.json(
        { error: "AI returned empty response" },
        { status: 500 },
      );
    }

    const cleanedResponse = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsedAI: JDMatchAIResponse;

    try {
      parsedAI = JSON.parse(cleanedResponse);
    } catch {
      return NextResponse.json(
        {
          error: "AI returned invalid JSON",
          rawResponse: cleanedResponse,
        },
        { status: 500 },
      );
    }

    if (!parsedAI || typeof parsedAI !== "object") {
      return NextResponse.json(
        { error: "Invalid AI response format" },
        { status: 500 },
      );
    }

    const finalData = {
      matchScore: Math.max(0, Math.min(100, Number(parsedAI.matchScore) || 0)),
      missingSkills: normalizeStringArray(parsedAI.missingSkills),
      resumeSkills: normalizeStringArray(parsedAI.resumeSkills),
      jdSkills: normalizeStringArray(parsedAI.jdSkills),
    };

    return NextResponse.json(finalData, { status: 200 });
  } catch (error: any) {
    console.error("JD Match Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
