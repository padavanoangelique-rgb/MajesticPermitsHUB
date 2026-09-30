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
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-background"
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
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-background"
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
        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary disabled:opacity-60 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary"
      >
        {loading ? "Saving..." : "Update stage"}
      </button>
    </div>
  );
}
