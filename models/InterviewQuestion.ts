import mongoose, { Schema } from "mongoose";

const InterviewQuestionSchema = new Schema(
  {
    fileName: String,
    extractedText: String,
    technicalQuestions: [String],
    projectQuestions: [String],
    experienceQuestions: [String],
    managerialQuestions: [String],
    questions: [String],
  },
  { timestamps: true },
);

export const InterviewQuestion =
  mongoose.models.InterviewQuestion ||
  mongoose.model("InterviewQuestion", InterviewQuestionSchema);
