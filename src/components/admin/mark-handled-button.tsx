"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkHandledButton({
  id,
  status,
  label,
  preferredDate,
}: {
  id: string;
  status: string;
  label: string;
  preferredDate?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handle() {
    setLoading(true);
    setMsg("");
    const res = await fetch(`/api/admin/inspection-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        handled_at: new Date().toISOString(),
        preferred_date: preferredDate || undefined,
        notify_contractor: true,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error || "Could not update");
    } else if (status === "Scheduled") {
      setMsg(
        data.emailed
          ? "Scheduled — contractor emailed."
          : data.texted
            ? "Scheduled — contractor texted."
            : data.email_error
              ? `Scheduled. Notify failed (${data.email_error}).`
              : "Scheduled."
      );
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handle}
        disabled={loading}
        className="rounded-xl bg-[#156cdd] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1157b8] disabled:opacity-50 dark:bg-[#b6ff2a] dark:text-black"
      >
        {loading ? "..." : label}
      </button>
      {msg && <span className="text-[11px] text-slate-500">{msg}</span>}
    </div>
  );
}
