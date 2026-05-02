export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { extractText } from "unpdf";

import { model as geminiModel } from "@/lib/gemini";
import { connectDB } from "@/lib/mongodb";
import {
  buildOptimizedPrompt,
  callGeminiWithFallback,
  cleanAIJsonResponse,
} from "@/lib/resumeAnalysis";
import { Resume } from "@/models/Resume";

type AIResponse = {
  summary: string;
  skills: string[];
  atsScore: number;
  suggestions: string[];
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const MAX_SIZE = 5 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 },
      );
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF, DOCX, and TXT files are supported" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let extractedText = "";

    try {
      if (file.type === "application/pdf") {
        const uint8Array = new Uint8Array(bytes);
        const { text } = await extractText(uint8Array, { mergePages: true });
        extractedText = text;
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else if (file.type === "text/plain") {
        extractedText = buffer.toString("utf-8");
      }
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

    const prompt = buildOptimizedPrompt(extractedText);
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
            "Failed to analyze resume. Please try again later.",
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

    let parsedAI: AIResponse;

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
      summary:
        typeof parsedAI.summary === "string"
          ? parsedAI.summary
          : "No summary generated",
      skills: Array.isArray(parsedAI.skills) ? parsedAI.skills : [],
      atsScore: Math.max(0, Math.min(100, Number(parsedAI.atsScore) || 0)),
      suggestions: Array.isArray(parsedAI.suggestions)
        ? parsedAI.suggestions
        : [],
    };

    const savedResume = await Resume.create(finalData);

    return NextResponse.json(savedResume, { status: 201 });
  } catch (error: any) {
    console.error("Resume Analyze Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
