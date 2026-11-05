"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WORK_STATUSES } from "@/lib/work-status";

/** Where the work is: the inspection bar. Majestic and the contractor can both set it, each from their own page. */
export function WorkStatusControl({
  jobId,
  current,
  role,
  locked,
}: {
  jobId: string;
  current: string | null;
  role: "admin" | "contractor";
  /** A reason the bar cannot be changed now (the permit is not approved, or the job is closed). */
  locked?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(current || WORK_STATUSES[0].key);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  if (locked) return <p className="text-sm text-muted-foreground">{locked}</p>;

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(role === "admin" ? `/api/admin/jobs/${jobId}/work-status` : `/api/contractor/jobs/${jobId}/work-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Could not save (${res.status})`);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <label className="grid gap-1 text-sm font-medium">
        Inspection status
        <select
          disabled={busy}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setSaved(false);
          }}
          className="min-h-12 rounded-xl border border-border bg-card px-3 text-sm"
        >
          {WORK_STATUSES.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <button type="button" disabled={busy} onClick={save} className="min-h-12 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "Saving..." : "Save inspection status"}
      </button>
      {status === "final_passed" && <p className="text-xs text-muted-foreground">Final passed closes the whole job out.</p>}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {saved && <p role="status" className="text-sm text-emerald-400">Saved.</p>}
    </div>
  );
}
