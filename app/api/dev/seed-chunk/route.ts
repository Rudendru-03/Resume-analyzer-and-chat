import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { Chunk } from "@/models/Chunk";

const EMBEDDING_DIMENSIONS = 768;

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This route is only available in development" },
      { status: 403 },
    );
  }

  try {
    await connectDB();

    const documentId = "dev-test-document";
    const chunk = await Chunk.findOneAndUpdate(
      { documentId, chunkIndex: 0 },
      {
        documentId,
        fileName: "dev-test.pdf",
        chunkIndex: 0,
        text: "This is a test chunk used to create the chunks collection before configuring MongoDB Atlas Vector Search.",
        embedding: Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0),
        metadata: {
          pageNumber: 1,
          source: "dev-seed",
        },
      },
      { new: true, upsert: true },
    );

    return NextResponse.json(
      {
        message: "Chunk collection is ready",
        collection: "chunks",
        documentId: chunk.documentId,
        chunkId: chunk._id,
        embeddingDimensions: EMBEDDING_DIMENSIONS,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Seed Chunk Error:", error);

    return NextResponse.json(
      {
        error: "Failed to seed chunk",
        message: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
