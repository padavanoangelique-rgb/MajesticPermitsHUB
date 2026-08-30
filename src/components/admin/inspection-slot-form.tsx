"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";

export interface InspectionSlot {
  id: string;
  slot: number;
  inspection_type: string | null;
  status: string;
  requested_date: string | null;
  scheduled_date: string | null;
  result_date: string | null;
  inspector_name: string | null;
  inspector_number: string | null;
  correction_notes: string | null;
  visible_to_homeowner: boolean;
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "not_required", label: "Not required" },
  { value: "not_requested", label: "Not requested" },
  { value: "requested", label: "Requested" },
  { value: "scheduled", label: "Scheduled" },
  { value: "passed", label: "Passed" },
  { value: "partial_pass", label: "Partial pass" },
  { value: "failed", label: "Failed — corrections needed" },
  { value: "reinspection_requested", label: "Reinspection requested" },
  { value: "reinspection_scheduled", label: "Reinspection scheduled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "closed", label: "Closed" },
];

export function InspectionSlotForm({
  slot,
  tradeType,
}: {
  slot: InspectionSlot;
  tradeType?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Sensible slot-3-is-final defaults
  const defaultType =
    slot.inspection_type ||
    (slot.slot === 3
      ? "Final"
      : tradeType?.toLowerCase().includes("roof")
        ? slot.slot === 1
          ? "Dry-in"
          : "In-progress"
        : "In-progress");

  async function save(formData: FormData) {
    setSaving(true);
    setMsg(null);
    const patch: Record<string, any> = {
      inspection_type: (formData.get("inspection_type") as string) || null,
      status: formData.get("status"),
      requested_date: formData.get("requested_date") || null,
      scheduled_date: formData.get("scheduled_date") || null,
      result_date: formData.get("result_date") || null,
      inspector_name: (formData.get("inspector_name") as string) || null,
      inspector_number: (formData.get("inspector_number") as string) || null,
      correction_notes: (formData.get("correction_notes") as string) || null,
      visible_to_homeowner: formData.get("visible_to_homeowner") === "on",
    };

    const res = await fetch(`/api/admin/inspections/${slot.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Saved");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setMsg(body.error || "Save failed");
    }
  }

  const summary = summarizeSlot(slot);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 text-sm font-semibold text-[#156cdd] dark:text-white">
            Inspection {slot.slot}
          </span>
          <span className="truncate text-sm text-slate-500 dark:text-slate-400">
            {defaultType}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {summary && (
            <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:inline">
              {summary}
            </span>
          )}
          <StatusPill status={slot.status} />
          <ChevronDown
            className={
              "h-4 w-4 text-slate-400 transition-transform " +
              (open ? "rotate-180" : "")
            }
          />
        </div>
      </button>

      {open && (
        <form
          action={save}
          className="border-t border-slate-200 px-4 py-4 dark:border-slate-700"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Type">
              <input
                name="inspection_type"
                defaultValue={defaultType}
                className="input"
              />
            </Field>
            <Field label="Status">
              <select name="status" defaultValue={slot.status} className="input">
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Inspector name">
              <input
                name="inspector_name"
                defaultValue={slot.inspector_name ?? ""}
                className="input"
              />
            </Field>
            <Field label="Requested">
              <input
                type="date"
                name="requested_date"
                defaultValue={slot.requested_date ?? ""}
                className="input"
              />
            </Field>
            <Field label="Scheduled">
              <input
                type="date"
                name="scheduled_date"
                defaultValue={slot.scheduled_date ?? ""}
                className="input"
              />
            </Field>
            <Field label="Result date">
              <input
                type="date"
                name="result_date"
                defaultValue={slot.result_date ?? ""}
                className="input"
              />
            </Field>
            <Field label="Inspection # / code" className="sm:col-span-3">
              <input
                name="inspector_number"
                defaultValue={slot.inspector_number ?? ""}
                className="input sm:max-w-xs"
              />
            </Field>
            <Field label="Correction notes" className="sm:col-span-3">
              <textarea
                name="correction_notes"
                defaultValue={slot.correction_notes ?? ""}
                rows={2}
                className="input"
              />
            </Field>
            <Field label="" className="sm:col-span-3">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  name="visible_to_homeowner"
                  defaultChecked={slot.visible_to_homeowner}
                />
                Show this inspection on the homeowner tracking page
              </label>
            </Field>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#156cdd] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save inspection"}
            </button>
            {msg && <span className="text-xs text-slate-500">{msg}</span>}
          </div>

          <style jsx>{`
            :global(.input) {
              width: 100%;
              border-radius: 0.5rem;
              border: 1px solid rgb(226 232 240);
              background: #fff;
              padding: 0.5rem 0.75rem;
              font-size: 0.875rem;
              color: #0f172a;
            }
            :global(.dark .input) {
              background: #0f172a;
              border-color: rgb(51 65 85);
              color: #e2e8f0;
            }
          `}</style>
        </form>
      )}
    </div>
  );
}

function summarizeSlot(slot: InspectionSlot): string | null {
  if (slot.result_date) {
    const date = format(new Date(slot.result_date), "MMM d");
    return slot.inspector_name ? `${date} · ${slot.inspector_name}` : date;
  }
  if (slot.scheduled_date) {
    return `Scheduled ${format(new Date(slot.scheduled_date), "MMM d")}`;
  }
  if (slot.requested_date) {
    return `Requested ${format(new Date(slot.requested_date), "MMM d")}`;
  }
  return null;
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={"block " + className}>
      {label && (
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      )}
      {children}
    </label>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    passed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    requested: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    reinspection_scheduled:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    reinspection_requested:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    partial_pass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    cancelled: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    closed: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    not_required:
      "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300",
    not_requested:
      "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300",
  };
  const label =
    STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  return (
    <span
      className={
        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium " +
        (map[status] ?? map.not_required)
      }
    >
      {label}
    </span>
  );
}
