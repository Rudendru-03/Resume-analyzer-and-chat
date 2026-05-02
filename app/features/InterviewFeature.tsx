"use client";
import { useState } from "react";

export default function InterviewFeature() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generateQuestions = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      // You need to implement this API route: /api/interview-questions
      const response = await fetch("/api/interview-questions", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setResult(data);
      }
    } catch (e) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <label className="w-full flex flex-col items-center gap-2 mb-6">
        <span className="text-white text-base font-semibold">Upload your resume (PDF, DOCX, or TXT):</span>
        <input
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-fuchsia-500 file:to-blue-400 file:text-white hover:file:from-fuchsia-600 hover:file:to-blue-500 transition-all bg-white/20 rounded-lg p-2 text-white w-full max-w-xs focus:outline-none"
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={loading}
        />
      </label>
      <button
        onClick={generateQuestions}
        disabled={!file || loading}
        className="w-full max-w-xs py-3 px-6 rounded-full bg-gradient-to-r from-fuchsia-500 to-blue-400 text-white font-bold text-lg shadow-lg hover:from-fuchsia-600 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {loading ? "Generating..." : "Generate Interview Questions"}
      </button>
      {error && (
        <div className="w-full bg-red-500/80 text-white rounded-lg p-3 mb-4 text-center animate-pulse">
          {error}
        </div>
      )}
      {result && (
        <div className="w-full bg-white/80 rounded-xl p-5 mt-2 shadow-inner">
          <h3 className="text-xl font-bold text-blue-900 mb-2">Interview Questions</h3>
          <ul className="list-decimal list-inside ml-4 text-gray-900">
            {Array.isArray(result.questions)
              ? result.questions.map((q: string, i: number) => (
                  <li key={i}>{q}</li>
                ))
              : <li>{result.questions}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}