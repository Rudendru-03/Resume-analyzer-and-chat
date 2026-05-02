"use client";
import { useState } from "react";

export default function JDMatchFeature() {
  const [resume, setResume] = useState<File | null>(null);
  const [jd, setJD] = useState<File | null>(null);
  const [jdText, setJDText] = useState("");
  const [jdInputMode, setJDInputMode] = useState<"file" | "text">("file");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadAndMatch = async () => {
    const trimmedJDText = jdText.trim();

    if (
      !resume ||
      (jdInputMode === "file" && !jd) ||
      (jdInputMode === "text" && !trimmedJDText)
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.append("resume", resume);

    if (jdInputMode === "file" && jd) {
      formData.append("jd", jd);
    }

    if (jdInputMode === "text") {
      formData.append("jdText", trimmedJDText);
    }

    try {
      const response = await fetch("/api/jd-match", {
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

  const hasJDInput =
    jdInputMode === "file" ? Boolean(jd) : Boolean(jdText.trim());

  const selectJDInputMode = (mode: "file" | "text") => {
    setJDInputMode(mode);
    setError(null);

    if (mode === "file") {
      setJDText("");
    } else {
      setJD(null);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col md:flex-row gap-4 w-full mb-6">
        <label className="flex-1 flex flex-col items-center gap-2">
          <span className="text-white text-base font-semibold">Upload Resume:</span>
          <input
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-fuchsia-500 file:to-blue-400 file:text-white hover:file:from-fuchsia-600 hover:file:to-blue-500 transition-all bg-white/20 rounded-lg p-2 text-white w-full max-w-xs focus:outline-none"
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => setResume(e.target.files?.[0] || null)}
            disabled={loading}
          />
        </label>
        <div className="flex-1 flex flex-col items-center gap-3">
          <span className="text-white text-base font-semibold">Upload Job Description (JD):</span>
          <div className="grid grid-cols-2 w-full max-w-xs rounded-full bg-white/15 p-1">
            <button
              type="button"
              onClick={() => selectJDInputMode("file")}
              disabled={loading}
              className={`rounded-full py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 ${jdInputMode === "file" ? "bg-gradient-to-r from-blue-400 to-fuchsia-500 shadow-md" : "hover:bg-white/15"}`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => selectJDInputMode("text")}
              disabled={loading}
              className={`rounded-full py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 ${jdInputMode === "text" ? "bg-gradient-to-r from-blue-400 to-fuchsia-500 shadow-md" : "hover:bg-white/15"}`}
            >
              Paste Text
            </button>
          </div>
          {jdInputMode === "file" ? (
            <input
              key="jd-file"
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-400 file:to-fuchsia-500 file:text-white hover:file:from-blue-500 hover:file:to-fuchsia-600 transition-all bg-white/20 rounded-lg p-2 text-white w-full max-w-xs focus:outline-none"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => setJD(e.target.files?.[0] || null)}
              disabled={loading}
            />
          ) : (
            <textarea
              className="bg-white/20 rounded-lg p-3 text-white placeholder:text-white/70 w-full max-w-xs min-h-32 resize-y focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
              placeholder="Paste job description text here"
              value={jdText}
              onChange={(e) => setJDText(e.target.value)}
              disabled={loading}
            />
          )}
        </div>
      </div>
      <button
        onClick={uploadAndMatch}
        disabled={!resume || !hasJDInput || loading}
        className="w-full max-w-xs py-3 px-6 rounded-full bg-gradient-to-r from-fuchsia-500 to-blue-400 text-white font-bold text-lg shadow-lg hover:from-fuchsia-600 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {loading ? "Matching..." : "Match Resume to JD"}
      </button>
      {error && (
        <div className="w-full bg-red-500/80 text-white rounded-lg p-3 mb-4 text-center animate-pulse">
          {error}
        </div>
      )}
      {result && (
        <div className="w-full bg-white/80 rounded-xl p-5 mt-2 shadow-inner">
          <h3 className="text-xl font-bold text-blue-900 mb-2">JD Match Result</h3>
          <div className="mb-2">
            <span className="font-semibold text-blue-700">Match Score:</span>
            <span className="ml-2 text-gray-900">{result.matchScore}%</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-blue-700">Missing Skills:</span>
            <span className="ml-2 text-gray-900">{Array.isArray(result.missingSkills) ? result.missingSkills.join(", ") : result.missingSkills}</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-blue-700">Resume Skills:</span>
            <span className="ml-2 text-gray-900">{Array.isArray(result.resumeSkills) ? result.resumeSkills.join(", ") : result.resumeSkills}</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-blue-700">JD Skills:</span>
            <span className="ml-2 text-gray-900">{Array.isArray(result.jdSkills) ? result.jdSkills.join(", ") : result.jdSkills}</span>
          </div>
        </div>
      )}
    </div>
  );
}
