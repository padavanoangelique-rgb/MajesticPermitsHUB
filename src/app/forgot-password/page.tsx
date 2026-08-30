"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );

      if (resetError) {
        setError(resetError.message);
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-background-dark">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-surface-dark">
        <div className="mb-8 text-center">
          <Image
            src="/icons/icon-512.png"
            alt="Majestic Permits"
            width={56}
            height={56}
            priority
            className="mx-auto rounded-2xl"
          />
          <h1 className="mt-4 text-2xl font-bold text-navy dark:text-white">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            We&apos;ll email you a secure reset link.
          </p>
        </div>

        {status === "success" ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900/40 dark:bg-green-950/20">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 dark:text-green-400" />
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
              If an account exists for <strong>{email}</strong>, we just sent a
              reset link. Check your inbox (and spam).
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-hover"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-navy dark:text-white"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                placeholder="you@company.com"
              />
            </div>

            {status === "error" && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white transition hover:bg-navy-hover disabled:opacity-60"
            >
              {status === "loading" ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-navy underline dark:text-gold"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
