import mongoose, { Schema } from "mongoose";

const ChunkSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    documentId: {
      type: String,
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    metadata: {
      pageNumber: Number,
      source: String,
    },
  },
  { timestamps: true },
);

ChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });

export const Chunk =
  mongoose.models.Chunk || mongoose.model("Chunk", ChunkSchema);
