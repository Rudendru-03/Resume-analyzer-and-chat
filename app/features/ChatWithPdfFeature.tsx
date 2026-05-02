"use client";

import { useState } from "react";

export default function ChatWithPdfFeature() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const askQuestion = () => {
    const trimmedQuestion = question.trim();

    if (!file || !trimmedQuestion) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", content: trimmedQuestion },
      {
        role: "assistant",
        content:
          "The document chat API is ready for connection. Upload handling is set in the UI.",
      },
    ]);
    setQuestion("");
  };

  return (
    <div className="flex w-full flex-col items-center">
      <label className="mb-6 flex w-full flex-col items-center gap-2">
        <span className="text-base font-semibold text-white">
          Upload a PDF document:
        </span>
        <input
          className="w-full max-w-xs rounded-lg bg-white/20 p-2 text-white transition-all file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-fuchsia-500 file:to-blue-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:from-fuchsia-600 hover:file:to-blue-500 focus:outline-none"
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </label>

      <div className="mb-4 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
        <input
          className="min-h-12 flex-1 rounded-lg bg-white/20 px-4 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-300"
          type="text"
          placeholder="Ask a question about the PDF"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          type="button"
          onClick={askQuestion}
          disabled={!file || !question.trim()}
          className="h-12 rounded-full bg-gradient-to-r from-fuchsia-500 to-blue-400 px-6 font-bold text-white shadow-lg transition-all hover:from-fuchsia-600 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ask
        </button>
      </div>

      {messages.length > 0 && (
        <div className="w-full max-w-2xl space-y-3 rounded-xl bg-white/80 p-5 shadow-inner">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "text-right text-blue-900"
                  : "text-left text-gray-900"
              }
            >
              <span className="inline-block rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                {message.content}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
