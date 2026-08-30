"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  // Supabase sends users here with a recovery access_token in the URL hash.
  // The client library picks it up automatically; we just need to wait for
  // the session to be established.
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    // Also try to read an existing session (page reload during recovery)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
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
            Set a new password
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Choose something at least 8 characters long.
          </p>
        </div>

        {status === "success" ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900/40 dark:bg-green-950/20">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 dark:text-green-400" />
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
              Password updated. You can sign in now.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-hover"
            >
              Sign in
            </Link>
          </div>
        ) : !ready ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            Waiting for a valid reset link… If this stays here, request a new
            link from{" "}
            <Link
              href="/forgot-password"
              className="font-medium underline"
            >
              Forgot password
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-navy dark:text-white"
              >
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label
                htmlFor="confirm"
                className="mb-1.5 block text-sm font-medium text-navy dark:text-white"
              >
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                placeholder="••••••••"
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
              {status === "loading" ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
