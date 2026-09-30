"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JobRequestActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function act(action: "approve" | "decline") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/job-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update");
      if (action === "approve" && data.job_id) {
        router.push(`/admin/jobs/${data.job_id}`);
        return;
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => act("approve")}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary disabled:opacity-60"
        >
          {busy ? "Saving…" : "Approve + add job"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => act("decline")}
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground disabled:opacity-60 dark:border-border"
        >
          Decline
        </button>
      </div>
      {error && <p className="text-xs text-red-200">{error}</p>}
    </div>
  );
}
