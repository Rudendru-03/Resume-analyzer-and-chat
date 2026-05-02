import { randomUUID } from "crypto";

export const PDF_CHAT_EMBEDDING_DIMENSIONS = 768;
export type PdfChatEmbeddingTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

const MAX_CHUNK_CHARACTERS = 1200;
const CHUNK_OVERLAP_CHARACTERS = 180;
const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";

export function createDocumentId(): string {
  return randomUUID();
}

export function splitTextIntoChunks(text: string): string[] {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];

  let start = 0;

  while (start < normalizedText.length) {
    const end = Math.min(start + MAX_CHUNK_CHARACTERS, normalizedText.length);
    const chunk = normalizedText.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= normalizedText.length) {
      break;
    }

    start = Math.max(end - CHUNK_OVERLAP_CHARACTERS, start + 1);
  }

  return chunks;
}

export function buildPdfChatAnswerPrompt(
  question: string,
  contextChunks: string[],
): string {
  return `Answer the user's question using ONLY the PDF context below.

Rules:
- Be concise and clear.
- If the answer is not in the context, say "I could not find that in the PDF."
- Do not invent details.

Question:
${question}

PDF Context:
${contextChunks
  .map((chunk, index) => `Context ${index + 1}:\n${chunk}`)
  .join("\n\n")}`;
}

export async function createPdfChatEmbedding(
  text: string,
  taskType: PdfChatEmbeddingTask,
): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
        taskType,
        outputDimensionality: PDF_CHAT_EMBEDDING_DIMENSIONS,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini embedding failed: ${response.status} ${response.statusText} ${errorText}`,
    );
  }

  const data = await response.json();
  const values = data?.embedding?.values;

  if (!Array.isArray(values)) {
    throw new Error("Gemini embedding response did not include values");
  }

  if (values.length !== PDF_CHAT_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Gemini embedding returned ${values.length} dimensions, expected ${PDF_CHAT_EMBEDDING_DIMENSIONS}`,
    );
  }

  return values;
}
