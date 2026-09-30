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
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary dark:border-border dark:hover:bg-secondary"
    >
      {label}
    </button>
  );
}
