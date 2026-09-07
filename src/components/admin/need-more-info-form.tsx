"use client";

import { useState } from "react";

export function NeedMoreInfoForm({
  jobId,
  contractorEmail,
  contractorName,
}: {
  jobId: string;
  contractorEmail: string | null;
  contractorName: string | null;
}) {
  const [kind, setKind] = useState<"attachment" | "note">("attachment");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");

  async function send() {
    setBusy(true);
    setOk("");
    setError("");
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/need-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send");
      setOk(`Sent to ${data.emailed}`);
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Failed");
    }
    setBusy(false);
  }

  if (!contractorEmail) {
    return (
      <p className="text-sm text-slate-500">
        Assign a contractor with an email first. Then this button emails them a
        link back to the job.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Sends to {contractorName || "the contractor"} at {contractorEmail}. The
        email includes an <strong>Attach here</strong> button to their Hub job.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setKind("attachment")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            kind === "attachment"
              ? "bg-[#156cdd] text-white"
              : "border border-slate-200 dark:border-slate-700"
          }`}
        >
          Attachment needed
        </button>
        <button
          type="button"
          onClick={() => setKind("note")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            kind === "note"
              ? "bg-[#156cdd] text-white"
              : "border border-slate-200 dark:border-slate-700"
          }`}
        >
          Note needed
        </button>
      </div>
      <textarea
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={
          kind === "attachment"
            ? "e.g. Please upload the signed NOC and product approval."
            : "e.g. Confirm the existing window sizes before we submit."
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#020202] dark:text-white"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {ok && <p className="text-xs text-green-600">{ok}</p>}
      <button
        type="button"
        onClick={send}
        disabled={busy || !message.trim()}
        className="rounded-xl bg-[#156cdd] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Sending…" : "Need more information"}
      </button>
    </div>
  );
}
