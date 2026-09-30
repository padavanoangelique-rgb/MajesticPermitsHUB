"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HomeownerNoteForm({
  jobId,
  initialValue,
}: {
  jobId: string;
  initialValue: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeowner_note: value || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      setMessage("Saved");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Shown to the homeowner on their tracking link. Keep it plain-language.
        No fees, contractor billing, or internal detail.
      </p>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Optional message for the homeowner (leave blank for none)"
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground dark:border-border dark:bg-background dark:text-white"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save homeowner note"}
        </button>
        {message && (
          <span className="text-xs text-green-700 dark:text-green-400">
            {message}
          </span>
        )}
        {error && (
          <span className="text-xs text-red-200 dark:text-red-400">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
