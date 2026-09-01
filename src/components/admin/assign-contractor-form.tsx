"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AssignContractorForm({
  jobId,
  currentContractorId,
  contractors,
}: {
  jobId: string;
  currentContractorId: string | null;
  contractors: Array<{ id: string; name: string | null; company_name: string | null }>;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentContractorId || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setSaved(false);
    setError("");

    const res = await fetch(`/api/admin/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractor_id: value || null }),
    });

    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not save");
    }

    setSaving(false);
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#020202] dark:text-white"
        >
          <option value="">Not assigned (homeowner-only job)</option>
          {contractors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name || c.name || c.id}
            </option>
          ))}
        </select>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-[#e2ba00] px-4 py-2 text-sm font-semibold text-[#156cdd] hover:bg-[#E0C878] disabled:opacity-60 dark:bg-[#9CE824] dark:hover:bg-[#85c91c]"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {saved && <p className="text-xs text-green-600">Saved.</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-slate-500">
        Assigning a contractor is what makes this job appear in their dashboard.
      </p>
    </div>
  );
}
