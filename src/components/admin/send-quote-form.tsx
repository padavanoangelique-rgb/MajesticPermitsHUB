"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SendQuoteForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);
  const [emailError, setEmailError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEmailError("");
    setPayUrl(null);

    try {
      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          amount: Number(amount),
          description: description || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create quote");

      setPayUrl(data.pay_url || null);
      setEmailed(Boolean(data.emailed));
      setEmailError(data.emailed ? "" : data.email_error || "");
      setAmount("");
      setDescription("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Amount (USD)
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="750.00"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            What it covers
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Permit application + city fees"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-[#0B1F3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152C56] disabled:opacity-60"
      >
        {loading ? "Creating quote..." : "Create quote + email payment link"}
      </button>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {payUrl && (
        <div className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
          <p className="font-medium">
            Quote created{emailed ? " and emailed to the client" : ""}.
          </p>
          {!emailed && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              The email could not be sent
              {emailError ? ` (${emailError})` : ""} — copy the payment link
              below and send it to the client manually.
            </p>
          )}
          <a
            href={payUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block break-all underline"
          >
            {payUrl}
          </a>
        </div>
      )}
    </form>
  );
}
