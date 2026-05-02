import mongoose, { Schema } from "mongoose";

const ResumeSchema = new Schema(
  {
    fileName: String,
    extractedText: String,
    summary: String,
    skills: [String],
    atsScore: Number,
    suggestions: [String],
  },
  { timestamps: true },
);

export const Resume =
  mongoose.models.Resume || mongoose.model("Resume", ResumeSchema);
