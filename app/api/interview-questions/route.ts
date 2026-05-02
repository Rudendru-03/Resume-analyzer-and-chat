export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { extractText } from "unpdf";

import { model as geminiModel } from "@/lib/gemini";
import { connectDB } from "@/lib/mongodb";
import {
  buildInterviewQuestionsPrompt,
  callGeminiWithFallback,
  cleanAIJsonResponse,
} from "@/lib/resumeAnalysis";
import { InterviewQuestion } from "@/models/InterviewQuestion";

type InterviewAIResponse = {
  technicalQuestions: string[];
  projectQuestions: string[];
  experienceQuestions: string[];
  managerialQuestions: string[];
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
    await connectDB();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF, DOCX, and TXT files are supported" },
        { status: 400 },
      );
    }

    let extractedText = "";

    try {
      extractedText = await extractTextFromFile(file);
    } catch (extractError: any) {
      return NextResponse.json(
        {
          error: "Failed to extract text from file",
          message: extractError?.message || "Unknown extraction error",
        },
        { status: 400 },
      );
    }

    extractedText = extractedText.trim();

    if (!extractedText) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from file. The file might be empty or corrupted.",
        },
        { status: 400 },
      );
    }

    if (extractedText.length < 50) {
      return NextResponse.json(
        {
          error:
            "Extracted text is too short. Please upload a valid resume with sufficient content.",
        },
        { status: 400 },
      );
    }

    const prompt = buildInterviewQuestionsPrompt(extractedText);
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
            "Failed to generate interview questions. Please try again later.",
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

    const cleanedResponse = cleanAIJsonResponse(responseText);

    let parsedAI: InterviewAIResponse;

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
      fileName: file.name,
      extractedText,
      technicalQuestions: normalizeStringArray(parsedAI.technicalQuestions),
      projectQuestions: normalizeStringArray(parsedAI.projectQuestions),
      experienceQuestions: normalizeStringArray(parsedAI.experienceQuestions),
      managerialQuestions: normalizeStringArray(parsedAI.managerialQuestions),
    };

    const savedInterviewQuestions = await InterviewQuestion.create({
      ...finalData,
      questions: [
        ...finalData.technicalQuestions,
        ...finalData.projectQuestions,
        ...finalData.experienceQuestions,
        ...finalData.managerialQuestions,
      ],
    });

    return NextResponse.json(savedInterviewQuestions, { status: 201 });
  } catch (error: any) {
    console.error("Interview Questions Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
