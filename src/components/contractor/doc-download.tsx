"use client";

export function DocDownload({ id, label }: { id: string; label: string }) {
  return (
    <button
      onClick={async () => {
        const res = await fetch(`/api/documents/${id}/signed-url`);
        const j = await res.json();
        if (j.url) window.open(j.url, "_blank");
        else alert(j.error || "Download unavailable");
      }}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
    >
      {label}
    </button>
  );
}
