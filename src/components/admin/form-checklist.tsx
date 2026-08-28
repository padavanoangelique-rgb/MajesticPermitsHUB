"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getFormTemplate } from "@/lib/roofing/forms";

export interface ChecklistRow {
  id: string;
  template_code: string;
  title: string;
  required: boolean;
  status: string;
  document_id: string | null;
  waived_reason: string | null;
  notes: string | null;
  sort_order: number;
}

export interface DocumentOption {
  id: string;
  file_name: string;
  category: string;
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "not_started", label: "Not started" },
  { value: "sent_to_contractor", label: "Sent to contractor" },
  { value: "uploaded", label: "Uploaded" },
  { value: "signed", label: "Signed" },
  { value: "notarized", label: "Notarized" },
  { value: "accepted", label: "Accepted" },
  { value: "waived", label: "Waived / N-A" },
];

const DONE = new Set(["accepted", "waived"]);

function statusTone(status: string, required: boolean) {
  if (status === "accepted") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  if (status === "waived") return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
  if (!required) return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
  if (status === "not_started") return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  return "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300";
}

export function FormChecklist({
  jobId,
  items,
  documents,
}: {
  jobId: string;
  items: ChecklistRow[];
  documents: DocumentOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const outstanding = items.filter(
    (i) => i.required && !DONE.has(i.status)
  ).length;

  async function patch(id: string, body: Record<string, any>) {
    setBusy(true);
    await fetch(`/api/admin/checklist/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    router.refresh();
  }

  async function rebuild() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/roofing/${jobId}/checklist`, {
      method: "POST",
    });
    setBusy(false);
    setMsg(res.ok ? "Checklist rebuilt" : "Rebuild failed");
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {items.length === 0 ? (
            "No checklist yet — set the roof system, then rebuild."
          ) : outstanding === 0 ? (
            <span className="font-semibold text-emerald-600">
              All required forms are accounted for.
            </span>
          ) : (
            <>
              <span className="font-semibold text-[#0B1F3F] dark:text-white">
                {outstanding}
              </span>{" "}
              required item{outstanding === 1 ? "" : "s"} still outstanding.
            </>
          )}
        </p>
        <div className="flex items-center gap-3">
          {msg && <span className="text-xs text-slate-500">{msg}</span>}
          <button
            onClick={rebuild}
            disabled={busy}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Rebuild from rules
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">
          {items.map((item) => {
            const template = getFormTemplate(item.template_code);
            return (
              <li key={item.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-[#0B1F3F] dark:text-white">
                        {item.title}
                      </span>
                      {!item.required && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Optional
                        </span>
                      )}
                      {template?.requiresNotary && (
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                          Notary
                        </span>
                      )}
                      {template?.requiresOwnerSignature && (
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                          Owner signs
                        </span>
                      )}
                    </div>
                    {template?.authority && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {template.authority}
                      </p>
                    )}
                    {item.notes && (
                      <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
                    )}
                    {item.waived_reason && (
                      <p className="mt-1 text-xs italic text-slate-400">
                        {item.waived_reason}
                      </p>
                    )}
                    {template?.publicPath && (
                      <a
                        href={template.publicPath}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-semibold text-[#C9A24B] hover:underline"
                      >
                        Download blank form
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <select
                      value={item.status}
                      disabled={busy}
                      onChange={(e) => patch(item.id, { status: e.target.value })}
                      className={`rounded-lg border-0 px-2 py-1 text-xs font-semibold ${statusTone(
                        item.status,
                        item.required
                      )}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={item.document_id ?? ""}
                      disabled={busy}
                      onChange={(e) =>
                        patch(item.id, { document_id: e.target.value || null })
                      }
                      className="max-w-[14rem] rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="">Link uploaded file…</option>
                      {documents.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.file_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
