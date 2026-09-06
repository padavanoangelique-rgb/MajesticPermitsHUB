"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TRADES = [
  "Windows",
  "Doors",
  "Roofing",
  "Renovation",
  "Pool",
  "Electrical",
  "HVAC",
  "Plumbing",
  "Other",
];

export function NewJobRequestForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function onFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, 5);
    setFiles(next);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    files.forEach((file) => form.append("files", file));
    try {
      const res = await fetch("/api/contractor/job-requests", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send request");
      setDone(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not send request");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-[#090909]">
        <p className="text-lg font-semibold text-[#156cdd] dark:text-white">Request sent</p>
        <p className="mt-2 text-sm text-slate-500">
          Majestic has the address and documents. You will see the job here after it is approved.
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-6 rounded-xl bg-[#156cdd] px-4 py-2 text-sm font-semibold text-white"
        >
          Back to projects
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Property address *</label>
        <input
          name="property_address"
          required
          placeholder="123 Main St, Miami, FL"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#090909]"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Trade</label>
          <select
            name="trade_type"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#090909]"
          >
            <option value="">Select trade</option>
            {TRADES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">City / jurisdiction</label>
          <input
            name="jurisdiction"
            placeholder="Pembroke Pines"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#090909]"
          />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Homeowner name</label>
          <input
            name="homeowner_name"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#090909]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Homeowner phone</label>
          <input
            name="homeowner_phone"
            type="tel"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#090909]"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Homeowner email</label>
        <input
          name="homeowner_email"
          type="email"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#090909]"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Notes for Majestic</label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Scope, existing permit #, HOA, anything we should know."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#090909]"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Documents (up to 5)</label>
        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.heic,.webp,.doc,.docx,.xls,.xlsx"
          onChange={(e) => onFiles(e.target.files)}
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#156cdd] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
        />
        {files.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-slate-500">
            {files.map((file, idx) => (
              <li key={`${file.name}-${idx}`} className="flex items-center justify-between">
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                  className="ml-3 text-red-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1.5 text-[11px] text-slate-400">
          Plans, NOC, product approvals, photos. PDF or image, 8MB each.
        </p>
      </div>
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#156cdd] py-3.5 text-sm font-semibold text-white hover:bg-[#1157b8] disabled:opacity-60"
      >
        {loading ? "Sending…" : "Send job request"}
      </button>
    </form>
  );
}
