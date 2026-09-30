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
              ? "bg-primary text-white"
              : "bg-secondary text-foreground hover:bg-secondary disabled:opacity-40 dark:bg-secondary dark:text-foreground"
          }`}
        >
          Bill contractor
        </button>
        <button
          type="button"
          onClick={() => setBillTo("homeowner")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            billTo === "homeowner"
              ? "bg-primary text-white"
              : "bg-secondary text-foreground hover:bg-secondary dark:bg-secondary dark:text-foreground"
          }`}
        >
          Bill homeowner
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-background dark:text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            What it covers
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Permit application + city fees"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-background dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Permit receipts (attached to the invoice email)
        </label>
        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={(e) => setReceipts(Array.from(e.target.files || []).slice(0, 5))}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
        />
        {receipts.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {receipts.map((f) => f.name).join(", ")}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Expires in (days)
          </label>
          <input
            type="number"
            min="1"
            max="180"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-background dark:text-white"
          />
        </div>
        <label className="mt-6 flex items-center gap-2 text-xs font-medium text-muted-foreground dark:text-muted-foreground sm:col-span-2">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Email the quote / invoice now
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading
          ? "Creating…"
          : sendEmail
          ? `Create + email ${billTo}`
          : "Create quote (no email)"}
      </button>

      {error && (
        <p className="rounded-xl bg-red-950/30 px-3 py-2 text-sm text-red-200">{error}</p>
      )}

      {(payUrl || approvalUrl) && (
        <div className="space-y-2 rounded-xl bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
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
