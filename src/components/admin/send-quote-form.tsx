"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BillTo = "homeowner" | "contractor";

export function SendQuoteForm({
  jobId,
  hasContractor,
}: {
  jobId: string;
  hasContractor: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [billTo, setBillTo] = useState<BillTo>(
    hasContractor ? "contractor" : "homeowner"
  );
  const [expiresInDays, setExpiresInDays] = useState<string>("14");
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);
  const [emailError, setEmailError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEmailError("");
    setPayUrl(null);
    setApprovalUrl(null);

    try {
      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          amount: Number(amount),
          description: description || null,
          bill_to: billTo,
          expires_in_days: expiresInDays ? Number(expiresInDays) : null,
          send_email: sendEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create quote");

      setPayUrl(data.pay_url || null);
      setApprovalUrl(data.approval_url || null);
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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setBillTo("contractor")}
          disabled={!hasContractor}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            billTo === "contractor"
              ? "bg-[#156cdd] text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-700 dark:text-slate-200"
          }`}
          title={
            hasContractor
              ? "Bill the assigned contractor"
              : "Assign a contractor to this job first"
          }
        >
          Bill contractor
        </button>
        <button
          type="button"
          onClick={() => setBillTo("homeowner")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            billTo === "homeowner"
              ? "bg-[#156cdd] text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
          }`}
        >
          Bill homeowner
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
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
        <div className="sm:col-span-2">
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

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Expires in (days)
          </label>
          <input
            type="number"
            min="1"
            max="180"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            placeholder="14"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
          />
        </div>
        <label className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 sm:col-span-2">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Email the quote link now
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-[#156cdd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1157b8] disabled:opacity-60"
      >
        {loading
          ? "Creating quote..."
          : sendEmail
          ? `Create quote + email ${billTo}`
          : "Create quote (no email)"}
      </button>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {(payUrl || approvalUrl) && (
        <div className="space-y-2 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
          <p className="font-medium">
            Quote created
            {sendEmail && emailed ? " and emailed" : ""}.
          </p>
          {sendEmail && !emailed && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              The email could not be sent
              {emailError ? ` (${emailError})` : ""} — copy the link(s) below and
              send them manually.
            </p>
          )}
          {approvalUrl && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Approval link
              </p>
              <a
                href={approvalUrl}
                target="_blank"
                rel="noreferrer"
                className="block break-all underline"
              >
                {approvalUrl}
              </a>
            </div>
          )}
          {payUrl && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Payment link
              </p>
              <a
                href={payUrl}
                target="_blank"
                rel="noreferrer"
                className="block break-all underline"
              >
                {payUrl}
              </a>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
