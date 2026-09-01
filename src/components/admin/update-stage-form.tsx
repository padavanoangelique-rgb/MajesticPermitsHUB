"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UpdateStageForm({
  jobId,
  currentStage,
  currentSubStatus,
}: {
  jobId: string;
  currentStage: string;
  currentSubStatus: string;
}) {
  const router = useRouter();
  const [stage, setStage] = useState(currentStage);
  const [subStatus, setSubStatus] = useState(currentSubStatus);
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    setLoading(true);

    await fetch(`/api/admin/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, sub_status: subStatus }),
    });

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#020202]"
        >
          <option>Getting your project ready</option>
          <option>Submitted to the city</option>
          <option>Under review</option>
          <option>Corrections requested</option>
          <option>Approved — ready to build</option>
          <option>Inspections in progress</option>
          <option>Final inspection passed</option>
          <option>Permit closed — all done</option>
        </select>
        <select
          value={subStatus}
          onChange={(e) => setSubStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#020202]"
        >
          <option>Need to Submit</option>
          <option>In Review</option>
          <option>Approved</option>
          <option>Approved and Printed</option>
          <option>Complete</option>
        </select>
      </div>
      <button
        onClick={handleUpdate}
        disabled={loading}
        className="rounded-xl bg-[#e2ba00] px-4 py-2 text-sm font-semibold text-[#156cdd] hover:bg-[#E0C878] disabled:opacity-60"
      >
        {loading ? "Saving..." : "Update stage"}
      </button>
    </div>
  );
}
