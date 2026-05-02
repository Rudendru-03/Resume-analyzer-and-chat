import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

// Primary model: Gemini 2.5 Flash
// (Most stable and capable for 2026 production apps)
export const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// Fallback model: Gemini 2.0 Flash-Lite
// (Higher throughput limits and significantly lower latency than standard Flash)
export const flashLiteModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
});
