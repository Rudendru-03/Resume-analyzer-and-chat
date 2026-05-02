"use client";

import { useState, Suspense, lazy } from "react";

// Lazy load feature components
const ATSFeature = lazy(() => import("./features/ATSFeature"));
const JDMatchFeature = lazy(() => import("./features/JDMatchFeature"));
const InterviewFeature = lazy(() => import("./features/InterviewFeature"));

type Feature = "ats" | "jd" | "interview";

export default function HomePage() {
  const [feature, setFeature] = useState<Feature>("ats");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black p-6">
      <div className="w-full max-w-xl bg-white/10 rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-blue-400 to-cyan-400 drop-shadow mb-2 animate-pulse text-center">
          Resume Analyzer
        </h1>
        <h2 className="text-lg md:text-xl text-blue-100 font-medium mb-8 text-center">
          Instantly analyze your resume for ATS optimization, JD matching, and interview prep.
        </h2>
        <div className="flex gap-3 mb-8 w-full justify-center">
          <button
            className={`px-4 py-2 rounded-full font-semibold text-white transition-all shadow-md text-sm md:text-base ${feature === "ats" ? "bg-gradient-to-r from-fuchsia-500 to-blue-400" : "bg-white/20 hover:bg-fuchsia-500/40"}`}
            onClick={() => setFeature("ats")}
          >
            ATS + Summary
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold text-white transition-all shadow-md text-sm md:text-base ${feature === "jd" ? "bg-gradient-to-r from-fuchsia-500 to-blue-400" : "bg-white/20 hover:bg-fuchsia-500/40"}`}
            onClick={() => setFeature("jd")}
          >
            JD Matching
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold text-white transition-all shadow-md text-sm md:text-base ${feature === "interview" ? "bg-gradient-to-r from-fuchsia-500 to-blue-400" : "bg-white/20 hover:bg-fuchsia-500/40"}`}
            onClick={() => setFeature("interview")}
          >
            Interview Questions
          </button>
        </div>
        <Suspense fallback={<div className="text-white text-center py-10">Loading feature...</div>}>
          {feature === "ats" && <ATSFeature />}
          {feature === "jd" && <JDMatchFeature />}
          {feature === "interview" && <InterviewFeature />}
        </Suspense>
      </div>
    </div>
  );
}