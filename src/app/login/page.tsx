"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError("Signed in, but no session was returned. Please try again.");
        setLoading(false);
        return;
      }

      /*
       * Full page navigation (not router.push) so the browser sends the
       * freshly written auth cookies with the request. Middleware then
       * routes admins to /admin and contractors to /dashboard.
       */
      window.location.assign(nextPath || "/dashboard");
    } catch (err: any) {
      setError(
        err?.message ||
          "Could not reach the authentication service. Please try again."
      );
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
            Contractor Login
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to view your projects
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-primary dark:text-white"
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
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-background dark:text-white"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-primary dark:text-white"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-background dark:text-white"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-950/30 px-4 py-3 text-sm text-red-200 dark:bg-red-900/20 dark:text-red-400"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Need an account?{" "}
          <a
            href="mailto:hello@majesticpermits.com"
            className="text-primary underline dark:text-primary"
          >
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
