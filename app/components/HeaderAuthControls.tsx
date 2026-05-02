"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function HeaderAuthControls() {
  const { data: session, status } = useSession();
  const email = session?.user?.email;

  if (status === "loading") {
    return (
      <div className="h-10 w-full rounded-md bg-slate-100 sm:w-48" />
    );
  }

  if (email) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
          Welcome, {email}
        </p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex">
      <Link
        href="/login"
        className="grid h-10 place-items-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        Login
      </Link>
      <Link
        href="/signup"
        className="grid h-10 place-items-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Sign up
      </Link>
    </div>
  );
}
