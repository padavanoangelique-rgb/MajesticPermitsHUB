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
      <div className="mt-10 rounded-2xl border border-emerald-800/40 bg-emerald-950/30 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
        <p className="font-medium text-emerald-200 dark:text-green-300">
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
          className="w-full rounded-2xl border-2 border-primary bg-card py-4 text-base font-semibold text-primary transition hover:bg-primary hover:text-white dark:border-primary dark:text-primary dark:hover:bg-primary dark:hover:text-primary-foreground"
        >
          Request an Inspection
        </button>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 dark:border-border dark:bg-card">
          <h3 className="text-lg font-semibold text-primary dark:text-white">
            Request an Inspection
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us what type of inspection you need.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Inspection type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm dark:border-border dark:bg-background"
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
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm dark:border-border dark:bg-background"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={submit}
                disabled={loading}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send request"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-border px-4 py-3 text-sm font-medium dark:border-border"
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
