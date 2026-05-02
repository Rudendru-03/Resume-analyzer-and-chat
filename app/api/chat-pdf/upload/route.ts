export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";

import { connectDB } from "@/lib/mongodb";
import {
  createPdfChatEmbedding,
  createDocumentId,
  splitTextIntoChunks,
} from "@/lib/pdfChat";
import { Chunk } from "@/models/Chunk";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "PDF size exceeds 8MB limit" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    let extractedText = "";

    try {
      const { text } = await extractText(new Uint8Array(bytes), {
        mergePages: true,
      });
      extractedText = text.trim();
    } catch (extractError: any) {
      return NextResponse.json(
        {
          error: "Failed to extract text from PDF",
          message: extractError?.message || "Unknown extraction error",
        },
        { status: 400 },
      );
    }

    if (!extractedText) {
      return NextResponse.json(
        { error: "Could not extract text from this PDF" },
        { status: 400 },
      );
    }

    const chunks = splitTextIntoChunks(extractedText);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Could not create searchable chunks from this PDF" },
        { status: 400 },
      );
    }

    await connectDB();

    const documentId = createDocumentId();
    const chunkDocuments = await Promise.all(
      chunks.map(async (chunk, index) => ({
        documentId,
        fileName: file.name,
        chunkIndex: index,
        text: chunk,
        embedding: await createPdfChatEmbedding(chunk, "RETRIEVAL_DOCUMENT"),
        metadata: {
          source: "pdf-upload",
        },
      })),
    );

    await Chunk.insertMany(chunkDocuments);

    return NextResponse.json(
      {
        message: "PDF processed successfully",
        documentId,
        fileName: file.name,
        chunks: chunkDocuments.length,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Chat PDF Upload Error:", error);

    const isRateLimitError =
      error?.message?.includes("429") ||
      error?.message?.includes("quota") ||
      error?.message?.includes("rate limit");

    if (isRateLimitError) {
      return NextResponse.json(
        {
          error: "Embedding quota exceeded",
          message: "Please try again in a few minutes.",
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to process PDF",
        message: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
