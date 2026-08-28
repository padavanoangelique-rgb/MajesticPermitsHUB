"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CUTOFF_NOTICE,
  earliestRequestableDate,
  formatBusinessDay,
  isAfterCutoff,
} from "@/lib/inspection-cutoff";

type Mode = "general" | "final" | null;

export function InspectionRequestPanel({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [code, setCode] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Computed on the client so it stays correct if the tab is left open, and
  // re-validated on the server before anything is saved.
  const earliest = earliestRequestableDate();
  const afterCutoff = isAfterCutoff();

  function open(next: Exclude<Mode, null>) {
    setMode(next);
    setError(null);
    setSuccess(null);
    setCode(next === "final" ? "Final Inspection" : "");
    setPreferredDate("");
    setNotes("");
  }

  function close() {
    setMode(null);
    setError(null);
  }

  async function submit() {
    if (!code.trim()) {
      setError("Please enter the inspection code or name.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contractor/inspection-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          request_type: mode,
          inspection_code: code.trim(),
          preferred_date: preferredDate || null,
          notes,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json?.error || "We could not send that request. Please retry.");
      } else {
        setSuccess(
          `Request sent for “${code.trim()}”. Majestic Permits will confirm the scheduled date.`
        );
        setMode(null);
        router.refresh();
      }
    } catch {
      setError("Network problem — please try again.");
    }

    setLoading(false);
  }

  return (
    <div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/60 dark:bg-amber-900/20">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          Next-business-day inspection cutoff
        </p>
        <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-300">
          Submit your request by <strong>12:00 PM on the prior business day</strong>.
          Requests received after noon are scheduled for the next available
          inspection date.
        </p>
        <p className="mt-2 text-sm font-medium text-amber-900 dark:text-amber-200">
          {afterCutoff
            ? `Today’s noon cutoff has passed — your earliest available date is ${formatBusinessDay(
                earliest
              )}.`
            : `Earliest available date: ${formatBusinessDay(earliest)}.`}
        </p>
      </div>

      {success && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            {success}
          </p>
        </div>
      )}

      {mode === null ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => open("general")}
            className="flex-1 rounded-xl bg-[#0B1F3F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#152C56]"
          >
            Request an Inspection
          </button>
          <button
            onClick={() => open("final")}
            className="flex-1 rounded-xl border-2 border-[#0B1F3F] px-4 py-3 text-sm font-semibold text-[#0B1F3F] transition hover:bg-[#0B1F3F] hover:text-white dark:border-[#C9A24B] dark:text-[#C9A24B] dark:hover:bg-[#C9A24B] dark:hover:text-[#0B1F3F]"
          >
            Request Final Inspection
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
          <h3 className="text-base font-semibold text-[#0B1F3F] dark:text-white">
            {mode === "final" ? "Request Final Inspection" : "Request an Inspection"}
          </h3>

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="inspection-code"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Inspection code or name <span className="text-red-500">*</span>
              </label>
              <input
                id="inspection-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 107 Roof Dry-In, Windows &amp; Doors, Framing"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
              />
              <p className="mt-1 text-xs text-slate-500">
                Use your jurisdiction’s code if you have it, otherwise the plain
                name of the inspection.
              </p>
            </div>

            <div>
              <label
                htmlFor="preferred-date"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Preferred inspection date (optional)
              </label>
              <input
                id="preferred-date"
                type="date"
                min={earliest}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
              />
              <p className="mt-1 text-xs text-slate-500">
                Earliest selectable date is {formatBusinessDay(earliest)} based on
                the noon cutoff.
              </p>
            </div>

            <div>
              <label
                htmlFor="inspection-notes"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Notes for Majestic Permits (optional)
              </label>
              <textarea
                id="inspection-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. All windows are installed and ready."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={submit}
                disabled={loading}
                className="flex-1 rounded-xl bg-[#0B1F3F] py-3 text-sm font-semibold text-white hover:bg-[#152C56] disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send request"}
              </button>
              <button
                onClick={close}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-500">{CUTOFF_NOTICE}</p>
          </div>
        </div>
      )}
    </div>
  );
}
