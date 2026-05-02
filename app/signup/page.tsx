"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setLoading(false);

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.replace("/login");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#eef3f8] px-4 py-10 text-slate-950">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,rgba(100,116,139,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.16)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur sm:p-8"
      >
        <Link href="/" className="text-sm font-semibold text-slate-500">
          House of EdTech
        </Link>
        <h1 className="mt-6 text-3xl font-black">Create Account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Save your resume analysis and interview preparation history.
        </p>

        <label className="mt-6 block">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input
            className="mt-2 h-12 w-full rounded-md border border-slate-300 px-4 text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">Password</span>
          <input
            className="mt-2 h-12 w-full rounded-md border border-slate-300 px-4 text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">
            Confirm Password
          </span>
          <input
            className="mt-2 h-12 w-full rounded-md border border-slate-300 px-4 text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 h-12 w-full rounded-md bg-slate-950 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-slate-950">
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}
