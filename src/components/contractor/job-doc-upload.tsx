"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  ["intake", "Plans / intake"],
  ["corrections", "Corrections"],
  ["inspections", "Inspection photos"],
  ["closeout", "Closeout"],
  ["other", "Other"],
];

export function JobDocUpload({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("intake");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) {
      setError("Choose at least one file");
      return;
    }
    setBusy(true);
    setError("");
    setOk("");
    const form = new FormData();
    form.set("category", category);
    files.slice(0, 5).forEach((file) => form.append("files", file));
    try {
      const res = await fetch(`/api/contractor/jobs/${jobId}/documents`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setOk(`Uploaded ${data.files} file${data.files === 1 ? "" : "s"}. Majestic was notified.`);
      setFiles([]);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Upload to Majestic
      </p>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-[#020202] dark:text-white"
      >
        {CATEGORIES.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.heic,.webp,.doc,.docx,.xls,.xlsx"
        onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
        className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#156cdd] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
      />
      {files.length > 0 && (
        <p className="text-xs text-slate-500">{files.length} selected (max 5, 8MB each)</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {ok && <p className="text-xs text-green-600">{ok}</p>}
      <button
        type="submit"
        disabled={busy || !files.length}
        className="rounded-lg bg-[#156cdd] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Upload files"}
      </button>
    </form>
  );
}
