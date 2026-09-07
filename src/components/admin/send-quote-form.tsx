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
  const [receipts, setReceipts] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [attached, setAttached] = useState<string[]>([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEmailError("");
    setPayUrl(null);
    setApprovalUrl(null);
    setAttached([]);

    try {
      const form = new FormData();
      form.set("job_id", jobId);
      form.set("amount", amount);
      form.set("description", description);
      form.set("bill_to", billTo);
      form.set("expires_in_days", expiresInDays);
      form.set("send_email", sendEmail ? "true" : "false");
      receipts.slice(0, 5).forEach((file) => form.append("receipts", file));

      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create quote");

      setPayUrl(data.pay_url || null);
      setApprovalUrl(data.approval_url || null);
      setEmailed(Boolean(data.emailed));
      setEmailError(data.emailed ? "" : data.email_error || "");
      setAttached(data.receipts || []);
      setAmount("");
      setDescription("");
      setReceipts([]);
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
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#020202] dark:text-white"
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
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#020202] dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-500">
          Permit receipts (attached to the invoice email)
        </label>
        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={(e) => setReceipts(Array.from(e.target.files || []).slice(0, 5))}
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#156cdd] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
        />
        {receipts.length > 0 && (
          <p className="mt-1 text-xs text-slate-500">
            {receipts.map((f) => f.name).join(", ")}
          </p>
        )}
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
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#020202] dark:text-white"
          />
        </div>
        <label className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 sm:col-span-2">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Email the quote / invoice now
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-[#156cdd] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading
          ? "Creating…"
          : sendEmail
          ? `Create + email ${billTo}`
          : "Create quote (no email)"}
      </button>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {(payUrl || approvalUrl) && (
        <div className="space-y-2 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
          <p className="font-medium">
            Quote created{sendEmail && emailed ? " and emailed" : ""}.
          </p>
          {attached.length > 0 && (
            <p className="text-xs">Receipts on the email: {attached.join(", ")}</p>
          )}
          {approvalUrl && (
            <a href={approvalUrl} target="_blank" rel="noreferrer" className="block break-all underline">
              Preview what they see: {approvalUrl}
            </a>
          )}
          {payUrl && (
            <a href={payUrl} target="_blank" rel="noreferrer" className="block break-all underline">
              {payUrl}
            </a>
          )}
        </div>
      )}
    </form>
  );
}
