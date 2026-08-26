"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export interface HomeownerLink {
  token: string;
  enabled: boolean;
  expires_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  regenerated_at: string | null;
}

export function HomeownerShareControls({
  jobId,
  siteUrl,
  link,
}: {
  jobId: string;
  siteUrl: string;
  link: HomeownerLink | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const url = link ? `${siteUrl}/track/${link.token}` : "";

  async function patch(body: any) {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/homeowner-links/${jobId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      setMsg("Saved");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error || "Failed");
    }
  }

  return (
    <div className="space-y-4">
      {link && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
            {url}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(url);
              setMsg("Copied");
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Copy link
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            defaultChecked={link?.enabled ?? true}
            onChange={(e) => patch({ enabled: e.target.checked })}
          />
          Homeowner link enabled
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Expires (optional)
          </span>
          <input
            type="date"
            defaultValue={link?.expires_at ? link.expires_at.slice(0, 10) : ""}
            onBlur={(e) =>
              patch({ expires_at: e.currentTarget.value || null })
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <button
          onClick={() => {
            if (
              confirm(
                "Regenerate this link? The old URL will stop working immediately."
              )
            ) {
              patch({ regenerate: true });
            }
          }}
          disabled={busy}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Regenerate link
        </button>
        {link && (
          <>
            <span>Views: {link.view_count}</span>
            {link.last_viewed_at && (
              <span>
                Last opened:{" "}
                {format(new Date(link.last_viewed_at), "MMM d, yyyy p")}
              </span>
            )}
          </>
        )}
        {msg && <span className="text-slate-500">{msg}</span>}
      </div>
    </div>
  );
}
