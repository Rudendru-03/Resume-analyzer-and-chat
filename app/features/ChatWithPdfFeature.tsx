"use client";

import { useState } from "react";

export default function ChatWithPdfFeature() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPdf = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setDocumentId(null);
    setMessages([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/chat-pdf/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to process PDF");
        return;
      }

      setDocumentId(data.documentId);
      setFileName(data.fileName);
      setMessages([
        {
          role: "assistant",
          content: `PDF processed successfully. I indexed ${data.chunks} chunks from ${data.fileName}.`,
        },
      ]);
    } catch {
      setError("Network error while processing PDF");
    } finally {
      setUploading(false);
    }
  };

  const askQuestion = async () => {
    const trimmedQuestion = question.trim();

    if (!documentId || !trimmedQuestion) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", content: trimmedQuestion },
    ]);
    setQuestion("");
    setAsking(true);
    setError(null);

    try {
      const response = await fetch("/api/chat-pdf/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId, question: trimmedQuestion }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to answer question");
        return;
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        { role: "assistant", content: data.answer },
      ]);
    } catch {
      setError("Network error while asking question");
    } finally {
      setAsking(false);
    }
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
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setDocumentId(null);
            setFileName("");
            setMessages([]);
            setError(null);
          }}
          disabled={uploading || asking}
        />
      </label>

      <button
        type="button"
        onClick={processPdf}
        disabled={!file || uploading || asking}
        className="mb-4 h-12 w-full max-w-xs rounded-full bg-gradient-to-r from-fuchsia-500 to-blue-400 px-6 font-bold text-white shadow-lg transition-all hover:from-fuchsia-600 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? "Processing PDF..." : "Process PDF"}
      </button>

      {documentId && (
        <div className="mb-4 w-full max-w-2xl rounded-lg bg-cyan-400/15 p-3 text-center text-sm font-semibold text-cyan-50">
          Ready to chat with {fileName}
        </div>
      )}

      <div className="mb-4 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
        <input
          className="min-h-12 flex-1 rounded-lg bg-white/20 px-4 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-300"
          type="text"
          placeholder="Ask a question about the PDF"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={!documentId || uploading || asking}
        />
        <button
          type="button"
          onClick={askQuestion}
          disabled={!documentId || !question.trim() || uploading || asking}
          className="h-12 rounded-full bg-gradient-to-r from-fuchsia-500 to-blue-400 px-6 font-bold text-white shadow-lg transition-all hover:from-fuchsia-600 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {asking ? "Asking..." : "Ask"}
        </button>
      </div>

      {error && (
        <div className="mb-4 w-full max-w-2xl rounded-lg bg-red-500/80 p-3 text-center text-white">
          {error}
        </div>
      )}

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
