"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Supabase recovery links land with a hash or code. Give the client a moment to exchange it.
    const timer = setTimeout(() => setReady(true), 800);
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      setMessage("Password updated. Taking you to sign in…");
      const admin = window.location.hostname === "admin.majesticpermits.com";
      setTimeout(() => {
        window.location.assign(admin ? "/admin" : "/dashboard");
      }, 800);
    } catch (err: any) {
      setError(err?.message || "Could not update password.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm dark:border-border dark:bg-card">
        <div className="mb-8 text-center">
          <Image
            src="/icons/icon-512.png"
            alt="Majestic Permits"
            width={56}
            height={56}
            priority
            className="mx-auto rounded-2xl"
          />
          <h1 className="mt-4 text-2xl font-bold text-primary dark:text-white">
            Set a new password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a new password for your account.
          </p>
        </div>

        {!ready ? (
          <p className="text-center text-sm text-muted-foreground">Opening your reset link…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-primary dark:text-white">
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-background dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-primary dark:text-white">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-background dark:text-white"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-red-950/30 px-4 py-3 text-sm text-red-200 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-xl bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary disabled:opacity-60"
            >
              {loading ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
