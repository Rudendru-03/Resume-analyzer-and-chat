"use client";

import { useState, Suspense, lazy } from "react";

const ATSFeature = lazy(() => import("./features/ATSFeature"));
const JDMatchFeature = lazy(() => import("./features/JDMatchFeature"));
const InterviewFeature = lazy(() => import("./features/InterviewFeature"));
const ChatWithPdfFeature = lazy(() => import("./features/ChatWithPdfFeature"));

type Feature = "ats" | "jd" | "interview" | "chat";

const features: { id: Feature; label: string }[] = [
  { id: "ats", label: "ATS + Summary" },
  { id: "jd", label: "JD Matching" },
  { id: "interview", label: "Interview Questions" },
  { id: "chat", label: "Chat with PDF" },
];

export default function HomePage() {
  const [feature, setFeature] = useState<Feature>("ats");

  return (
    <div className="min-h-screen overflow-hidden bg-[#eef3f8] text-slate-950">
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.16)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,0.12),transparent_32%)]" />

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <header className="fixed left-0 right-0 top-0 z-50 w-full border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-6 lg:px-10">
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-gradient-to-br from-slate-950 to-sky-900 text-sm font-bold text-white shadow-sm">
              HE
            </div>
            <div>
              <p className="text-base font-bold leading-tight text-slate-950">
                House of EdTech
              </p>
              <p className="text-sm text-slate-500">AI Career Workspace</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Login
            </button>
            <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
              Sign up
            </button>
          </div>
          </div>
        </header>

        <main className="flex w-full flex-1 flex-col px-4 pb-8 pt-32 sm:px-6 sm:pb-10 sm:pt-28 lg:px-10 lg:pb-12">
          <section className="mx-auto w-full max-w-5xl text-center">
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-6xl">
              Career Intelligence for Every Resume
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              Analyze ATS readiness, compare job descriptions, prepare interview
              questions, and explore documents in one focused AI workspace.
            </p>
          </section>

          <nav className="mx-auto mt-8 grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFeature(item.id)}
                className={`h-12 rounded-md border px-4 text-sm font-bold transition sm:text-base ${
                  feature === item.id
                    ? "border-slate-950 bg-slate-950 text-white shadow-md"
                    : "border-slate-300 bg-white/85 text-slate-700 hover:border-slate-500 hover:bg-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <section className="relative mt-6 w-full flex-1 overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-950 via-[#162145] to-[#082f49] p-4 shadow-2xl shadow-slate-400/40 sm:mt-8 sm:p-6 lg:p-8">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:36px_36px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,0.18),transparent_30%)]" />
            <div className="relative z-10 mx-auto w-full">
              <Suspense
                fallback={
                  <div className="py-16 text-center font-semibold text-white">
                    Loading feature...
                  </div>
                }
              >
                {feature === "ats" && <ATSFeature />}
                {feature === "jd" && <JDMatchFeature />}
                {feature === "interview" && <InterviewFeature />}
                {feature === "chat" && <ChatWithPdfFeature />}
              </Suspense>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
