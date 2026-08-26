"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-[#0A0F1C]">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B1F3F] text-lg font-bold text-white">
            M
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#0B1F3F] dark:text-white">
            Contractor Login
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to view your projects
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0B1F3F] dark:text-white">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0B1F3F] focus:ring-2 focus:ring-[#0B1F3F]/20 dark:border-slate-600 dark:bg-[#0A0F1C]"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0B1F3F] dark:text-white">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0B1F3F] focus:ring-2 focus:ring-[#0B1F3F]/20 dark:border-slate-600 dark:bg-[#0A0F1C]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#0B1F3F] py-3 text-sm font-semibold text-white transition hover:bg-[#152C56] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Need an account?{" "}
          <a href="mailto:hello@majesticpermits.com" className="text-[#0B1F3F] underline dark:text-[#C9A24B]">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
