"use client";

import { useState } from "react";

// Contractor-side inspection request form. Mirrors the homeowner variant
// but posts to a contractor-scoped API route that authenticates the caller
// via their signed-in Supabase session (no token needed).
export function RequestInspection({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState("Rough-in");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contractor/inspection-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          inspection_type: type,
          preferred_date: preferredDate || null,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setOpen(false);
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j?.error || `Request failed (${res.status})`);
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
        <p className="font-medium text-green-800 dark:text-green-300">
          Inspection request sent
        </p>
        <p className="mt-1 text-sm text-green-700 dark:text-green-400">
          Majestic Permits will schedule it and update this page shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl border-2 border-[#156cdd] bg-white py-4 text-base font-semibold text-[#156cdd] transition hover:bg-[#156cdd] hover:text-white dark:border-[#e2ba00] dark:text-[#e2ba00] dark:hover:bg-[#e2ba00] dark:hover:text-[#156cdd]"
        >
          Request an Inspection
        </button>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#111827]">
          <h3 className="text-lg font-semibold text-[#156cdd] dark:text-white">
            Request an Inspection
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Tell us what kind of inspection you need. Majestic Permits will
            schedule it with the city.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Inspection type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#0A0F1C]"
              >
                <option>Rough-in</option>
                <option>Final</option>
                <option>Partial</option>
                <option>Re-inspection</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Preferred date (optional)
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#0A0F1C]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Anything the inspector should know..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#0A0F1C]"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={submit}
                disabled={loading}
                className="flex-1 rounded-xl bg-[#156cdd] py-3 text-sm font-semibold text-white hover:bg-[#1157b8] disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send request"}
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium dark:border-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
