"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const RESULTS = ["Passed", "Failed", "Partial Pass", "Cancelled"] as const;

/**
 * Admin-only: record scheduling and the outcome of a contractor's inspection
 * request. Contractors see these values read-only on their project page.
 */
export function InspectionResultForm({
  id,
  scheduledDate,
  result,
  resultDate,
  correctionNotes,
}: {
  id: string;
  scheduledDate?: string | null;
  result?: string | null;
  resultDate?: string | null;
  correctionNotes?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scheduled, setScheduled] = useState(scheduledDate || "");
  const [outcome, setOutcome] = useState(result || "");
  const [outcomeDate, setOutcomeDate] = useState(resultDate || "");
  const [corrections, setCorrections] = useState(correctionNotes || "");

  async function save() {
    setSaving(true);
    setError(null);

    const status = outcome
      ? outcome === "Cancelled"
        ? "Cancelled"
        : "Completed"
      : scheduled
        ? "Scheduled"
        : "Pending";

    const res = await fetch(`/api/admin/inspection-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduled_date: scheduled || null,
        result: outcome || null,
        result_date: outcomeDate || null,
        correction_notes: corrections || null,
        status,
        handled_at: new Date().toISOString(),
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(json?.error || "Could not save.");
    } else {
      setOpen(false);
      router.refresh();
    }

    setSaving(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
      >
        Schedule / record result
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Scheduled date
          <input
            type="date"
            value={scheduled}
            onChange={(e) => setScheduled(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
          />
        </label>

        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Result
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
          >
            <option value="">Not recorded</option>
            {RESULTS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Result date
          <input
            type="date"
            value={outcomeDate}
            onChange={(e) => setOutcomeDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
          />
        </label>

        <label className="text-xs font-medium text-slate-600 sm:col-span-2 dark:text-slate-300">
          Correction notes (visible to contractor)
          <textarea
            rows={2}
            value={corrections}
            onChange={(e) => setCorrections(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
          />
        </label>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-[#0B1F3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152C56] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={saving}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium dark:border-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
