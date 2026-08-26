"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JurisdictionForm({
  jobId,
  initial,
}: {
  jobId: string;
  initial: {
    jurisdiction: string | null;
    building_dept_url: string | null;
    noc_status: string | null;
  };
}) {
  const router = useRouter();
  const [jurisdiction, setJurisdiction] = useState(initial.jurisdiction || "");
  const [url, setUrl] = useState(initial.building_dept_url || "");
  const [noc, setNoc] = useState(initial.noc_status || "None");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setOk(false);
    setError("");
    const res = await fetch(`/api/admin/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jurisdiction: jurisdiction || null,
        building_dept_url: url || null,
        noc_status: noc,
      }),
    });
    if (res.ok) {
      setOk(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not save");
    }
    setSaving(false);
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Jurisdiction
          </label>
          <input
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            placeholder="City of Hialeah"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Building dept. portal URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://hialeahfl.gov/permits"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          NOC status
        </label>
        <select
          value={noc}
          onChange={(e) => setNoc(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#0A0F1C] dark:text-white"
        >
          <option value="None">None</option>
          <option value="Pending">Pending</option>
          <option value="Submitted">Submitted</option>
          <option value="Recorded">Recorded</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Pending and Submitted NOCs surface in the weekly admin report.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-[#0B1F3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152C56] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-[#C9A24B] hover:underline"
          >
            Open portal ↗
          </a>
        )}
        {ok && <span className="text-xs text-green-600">Saved.</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
