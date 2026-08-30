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
        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900/50 dark:bg-transparent dark:hover:bg-red-950/30"
      >
        <Trash2 className="h-4 w-4" />
        Delete job
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => !deleting && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-[#111827]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-[#156cdd] dark:text-white">
              Delete this job permanently?
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              This will also delete every document, inspection slot, quote,
              homeowner link, and history entry attached to it. This cannot be
              undone.
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
              <p className="text-slate-500 dark:text-slate-400">
                Type the property address to confirm:
              </p>
              <p className="mt-1 font-semibold text-[#156cdd] dark:text-white">
                {propertyAddress}
              </p>
            </div>

            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Retype the address"
              disabled={deleting}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />

            {error && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-800"
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
