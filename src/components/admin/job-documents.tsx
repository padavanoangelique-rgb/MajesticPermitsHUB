"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export interface JobDocument {
  id: string;
  category: string;
  label: string | null;
  file_name: string;
  visible_to_homeowner: boolean;
  visible_to_contractor: boolean;
  created_at: string;
}

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "intake", label: "Intake documents" },
  { value: "submitted_package", label: "Submitted package" },
  { value: "corrections", label: "Corrections / revisions" },
  { value: "approved_permit", label: "Approved permit" },
  { value: "inspections", label: "Inspections" },
  { value: "closeout", label: "Closeout documents" },
  { value: "other", label: "Other" },
];

export function JobDocuments({
  jobId,
  documents,
}: {
  jobId: string;
  documents: JobDocument[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState("approved_permit");
  const [shareWithHomeowner, setShareWithHomeowner] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    if (!fileInput.files?.[0]) return;

    const fd = new FormData();
    fd.append("job_id", jobId);
    fd.append("category", category);
    fd.append("visible_to_homeowner", shareWithHomeowner ? "true" : "false");
    fd.append("file", fileInput.files[0]);

    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/documents", {
      method: "POST",
      body: fd,
    });
    setBusy(false);
    if (res.ok) {
      form.reset();
      setShareWithHomeowner(false);
      setMsg("Uploaded");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error || "Upload failed");
    }
  }

  async function toggleShare(doc: JobDocument) {
    await fetch(`/api/admin/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        visible_to_homeowner: !doc.visible_to_homeowner,
      }),
    });
    router.refresh();
  }

  async function remove(doc: JobDocument) {
    if (!confirm(`Delete ${doc.file_name}?`)) return;
    await fetch(`/api/admin/documents/${doc.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function download(doc: JobDocument) {
    const res = await fetch(`/api/admin/documents/${doc.id}/signed-url`);
    const j = await res.json();
    if (j.url) window.open(j.url, "_blank");
  }

  const grouped = CATEGORIES.map((c) => ({
    ...c,
    docs: documents.filter((d) => d.category === c.value),
  }));

  return (
    <div>
      <form onSubmit={onUpload} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block sm:col-span-1">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              File
            </span>
            <input
              type="file"
              name="file"
              required
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#156cdd] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </label>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={shareWithHomeowner}
            onChange={(e) => setShareWithHomeowner(e.target.checked)}
          />
          Share with homeowner immediately
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-[#156cdd] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Uploading…" : "Upload document"}
          </button>
          {msg && <span className="text-xs text-slate-500">{msg}</span>}
        </div>
      </form>

      <div className="mt-6 space-y-6">
        {grouped.map((group) => (
          <section key={group.value}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {group.label}
            </h3>
            {group.docs.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">No files yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-700">
                {group.docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <button
                        onClick={() => download(d)}
                        className="truncate text-sm font-medium text-[#156cdd] hover:underline dark:text-white"
                      >
                        {d.file_name}
                      </button>
                      <p className="text-xs text-slate-500">
                        {format(new Date(d.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={d.visible_to_homeowner}
                          onChange={() => toggleShare(d)}
                        />
                        Share with homeowner
                      </label>
                      <button
                        onClick={() => remove(d)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
