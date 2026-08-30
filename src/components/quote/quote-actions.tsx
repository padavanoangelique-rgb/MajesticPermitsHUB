"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuoteActions({
  token,
  billTo,
}: {
  token: string;
  billTo: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"idle" | "approving" | "declining">("idle");
  const [error, setError] = useState("");

  async function submit(action: "approve" | "decline") {
    if (action === "approve" && !name.trim()) {
      setError("Please type your name so we have a record of the approval.");
      return;
    }
    setError("");
    setMode(action === "approve" ? "approving" : "declining");
    try {
      const res = await fetch(`/api/quote/${token}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setMode("idle");
    }
  }

  const label =
    billTo === "contractor"
      ? "Type your name to approve on behalf of the contractor"
      : "Type your name to approve";

  return (
    <div className="mt-8 space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
          disabled={mode !== "idle"}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => submit("approve")}
          disabled={mode !== "idle"}
          className="rounded-xl bg-[#156cdd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1157b8] disabled:opacity-60"
        >
          {mode === "approving" ? "Approving..." : "Approve this quote"}
        </button>
        <button
          type="button"
          onClick={() => submit("decline")}
          disabled={mode !== "idle"}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-transparent dark:text-slate-200"
        >
          {mode === "declining" ? "Declining..." : "Decline"}
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <p className="text-xs text-slate-500">
        By approving you confirm the scope and price above. We'll send a copy of
        this decision to Majestic Permits automatically.
      </p>
    </div>
  );
}
