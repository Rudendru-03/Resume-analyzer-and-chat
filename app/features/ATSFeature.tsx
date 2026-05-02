"use client";
import { useState } from "react";

export default function ATSFeature() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadResume = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/analyze", {
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
        onClick={uploadResume}
        disabled={!file || loading}
        className="w-full max-w-xs py-3 px-6 rounded-full bg-gradient-to-r from-fuchsia-500 to-blue-400 text-white font-bold text-lg shadow-lg hover:from-fuchsia-600 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>
      {error && (
        <div className="w-full bg-red-500/80 text-white rounded-lg p-3 mb-4 text-center animate-pulse">
          {error}
        </div>
      )}
      {result && (
        <div className="w-full bg-white/80 rounded-xl p-5 mt-2 shadow-inner">
          <h3 className="text-xl font-bold text-blue-900 mb-2">Analysis Result</h3>
          <div className="mb-2">
            <span className="font-semibold text-blue-700">Summary:</span>
            <span className="ml-2 text-gray-900">{result.summary}</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-blue-700">Skills:</span>
            <span className="ml-2 text-gray-900">{Array.isArray(result.skills) ? result.skills.join(", ") : result.skills}</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-blue-700">ATS Score:</span>
            <span className="ml-2 text-gray-900">{result.atsScore}</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-blue-700">Suggestions:</span>
            <ul className="list-disc list-inside ml-4 text-gray-900">
              {Array.isArray(result.suggestions)
                ? result.suggestions.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))
                : <li>{result.suggestions}</li>}
            </ul>
          </div>
          <div className="mt-4 text-xs text-gray-500 break-all">
            <span className="font-semibold">File:</span> {result.fileName}
          </div>
        </div>
      )}
    </div>
  );
}