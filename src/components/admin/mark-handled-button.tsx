"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkHandledButton({
  id,
  status,
  label,
}: {
  id: string;
  status: string;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await fetch(`/api/admin/inspection-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, handled_at: new Date().toISOString() }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800"
    >
      {loading ? "..." : label}
    </button>
  );
}
