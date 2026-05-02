export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { model as geminiModel } from "@/lib/gemini";
import { connectDB } from "@/lib/mongodb";
import {
  buildPdfChatAnswerPrompt,
  createPdfChatEmbedding,
} from "@/lib/pdfChat";
import { callGeminiWithFallback } from "@/lib/resumeAnalysis";
import { Chunk } from "@/models/Chunk";

const VECTOR_INDEX_NAME = process.env.MONGODB_VECTOR_INDEX || "vector_index";

export async function POST(request: NextRequest) {
  try {
    const { documentId, question } = await request.json();
    const trimmedQuestion =
      typeof question === "string" ? question.trim() : "";

    if (!documentId || typeof documentId !== "string") {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 },
      );
    }

    if (!trimmedQuestion) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const questionEmbedding = await createPdfChatEmbedding(
      trimmedQuestion,
      "RETRIEVAL_QUERY",
    );
    const chunks = await Chunk.aggregate([
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector: questionEmbedding,
          numCandidates: 100,
          limit: 5,
          filter: {
            documentId,
          },
        },
      },
      {
        $project: {
          _id: 0,
          text: 1,
          chunkIndex: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    if (chunks.length === 0) {
      return NextResponse.json(
        {
          error:
            "No matching PDF chunks found. Check your Vector Search index name and documentId.",
        },
        { status: 404 },
      );
    }

    const contextChunks = chunks.map((chunk) => chunk.text);
    const prompt = buildPdfChatAnswerPrompt(trimmedQuestion, contextChunks);
    const answer = await callGeminiWithFallback(prompt, geminiModel);

    if (!answer) {
      return NextResponse.json(
        { error: "AI returned empty response" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      answer: answer.trim(),
      sources: chunks.map((chunk) => ({
        chunkIndex: chunk.chunkIndex,
        score: chunk.score,
      })),
    });
  } catch (error: any) {
    console.error("Chat PDF Ask Error:", error);

    const isRateLimitError =
      error?.message?.includes("429") ||
      error?.message?.includes("quota") ||
      error?.message?.includes("rate limit");

    if (isRateLimitError) {
      return NextResponse.json(
        {
          error: "AI quota exceeded",
          message: "Please try again in a few minutes.",
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to answer question",
        message: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
