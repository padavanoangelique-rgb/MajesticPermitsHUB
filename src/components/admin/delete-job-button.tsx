"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

/**
 * Danger-zone button on the admin job detail page.
 *
 * Two-step confirm: click "Delete job" to open the dialog, then type the
 * property address exactly to unlock the confirm button. Cascades everything
 * (documents, inspections, quotes, homeowner links, etc.) via the DELETE
 * handler in /api/admin/jobs/[id].
 */
export function DeleteJobButton({
  jobId,
  propertyAddress,
}: {
  jobId: string;
  propertyAddress: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm =
    typed.trim().toLowerCase() === propertyAddress.trim().toLowerCase();

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/admin/jobs/${jobId}`, { method: "DELETE" });
    if (res.ok) {
      // Navigate away before the underlying data disappears
      router.push("/admin");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTyped("");
          setError(null);
        }}
        className="inline-flex items-center gap-2 rounded-xl border border-red-800/40 bg-card px-3 py-1.5 text-sm font-medium text-red-200 hover:border-red-300 hover:bg-red-950/30 dark:border-red-900/50 dark:bg-transparent dark:hover:bg-red-950/30"
      >
        <Trash2 className="h-4 w-4" />
        Delete job
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4"
          onClick={() => !deleting && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl dark:border-border dark:bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-primary dark:text-white">
              Delete this job permanently?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
              This will also delete every document, inspection slot, quote,
              homeowner link, and history entry attached to it. This cannot be
              undone.
            </p>

            <div className="mt-4 rounded-xl bg-secondary p-3 text-sm dark:bg-secondary/50">
              <p className="text-muted-foreground dark:text-muted-foreground">
                Type the property address to confirm:
              </p>
              <p className="mt-1 font-semibold text-primary dark:text-white">
                {propertyAddress}
              </p>
            </div>

            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Retype the address"
              disabled={deleting}
              className="mt-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-border disabled:opacity-60 dark:border-border dark:bg-background dark:text-foreground"
            />

            {error && (
              <p className="mt-3 text-sm text-red-200 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary disabled:opacity-60 dark:text-muted-foreground dark:hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canConfirm || deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting…" : "Delete job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
