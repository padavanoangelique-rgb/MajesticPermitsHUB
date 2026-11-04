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
    let cancelled = false;

    async function boot() {
      try {
        // PKCE / code flow
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message);
          } else if (!cancelled) {
            setReady(true);
            return;
          }
        }

        // Implicit / hash flow (#access_token=...&type=recovery)
        const hash = window.location.hash.replace(/^#/, "");
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) {
              setError(sessionError.message);
            } else if (!cancelled) {
              setReady(true);
              return;
            }
          }
        }

        // Already have a recovery session
        const { data } = await supabase.auth.getSession();
        if (!cancelled && data.session) {
          setReady(true);
          return;
        }

        if (!cancelled) {
          setError("This reset link is invalid or expired. Request a new one from the login page.");
          setReady(true);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Could not open the reset link.");
          setReady(true);
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setError("");
      }
    });

    boot();
    return () => {
      cancelled = true;
      subscription.unsubscribe();
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
      setMessage("Password updated. Taking you in…");
      const admin = window.location.hostname === "admin.majesticpermits.com";
      setTimeout(() => {
        window.location.assign(admin ? "/admin" : "/dashboard");
      }, 600);
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
