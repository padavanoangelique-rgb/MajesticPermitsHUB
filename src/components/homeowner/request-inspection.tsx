"use client";

import { useState } from "react";

export function RequestInspection({ jobId, token }: { jobId: string; token: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [type, setType] = useState("Rough-in");
  const [notes, setNotes] = useState("");

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/inspection-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          token,
          inspection_type: type,
          notes,
          requested_by: "homeowner",
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="mt-10 rounded-2xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
        <p className="font-medium text-green-800 dark:text-green-300">
          Inspection request sent
        </p>
        <p className="mt-1 text-sm text-green-700 dark:text-green-400">
          We’ll schedule it and update you shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl border-2 border-[#156cdd] bg-white py-4 text-base font-semibold text-[#156cdd] transition hover:bg-[#156cdd] hover:text-white dark:border-[#9CE824] dark:text-[#9CE824] dark:hover:bg-[#9CE824] dark:hover:text-[#020202]"
        >
          Request an Inspection
        </button>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#090909]">
          <h3 className="text-lg font-semibold text-[#156cdd] dark:text-white">
            Request an Inspection
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Tell us what type of inspection you need.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Inspection type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#020202]"
              >
                <option>Rough-in</option>
                <option>Final</option>
                <option>Partial</option>
                <option>Re-inspection</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any details we should know..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#020202]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={submit}
                disabled={loading}
                className="flex-1 rounded-xl bg-[#156cdd] py-3 text-sm font-semibold text-white hover:bg-[#1157b8] disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send request"}
              </button>
              <button
                onClick={() => setOpen(false)}
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
