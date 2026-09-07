import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  InspectionsMonth,
  type CalendarEvent,
} from "@/components/contractor/inspections-month";
import { isFinalInspection } from "@/lib/close-on-final";

export const dynamic = "force-dynamic";

const REPORTABLE = new Set([
  "scheduled",
  "reinspection_scheduled",
  "requested",
  "reinspection_requested",
]);

export default async function ContractorInspectionsPage() {
  const user = await requireUser("/dashboard/inspections");
  const supabase = createClient();
  const contractor = await getContractorForUser(user);

  if (!contractor) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Account not linked.</p>
      </div>
    );
  }

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, property_address")
    .eq("contractor_id", contractor.id);

  const jobIds = (jobs || []).map((j) => j.id);
  const addressById = new Map((jobs || []).map((j) => [j.id, j.property_address]));
  const service = createServiceClient();

  const [{ data: inspections }, { data: pending }] =
    jobIds.length === 0
      ? [{ data: [] as any[] }, { data: [] as any[] }]
      : await Promise.all([
          service
            .from("job_inspections")
            .select(
              "id, job_id, slot, inspection_type, status, requested_date, scheduled_date, result_date"
            )
            .in("job_id", jobIds),
          service
            .from("inspection_requests")
            .select("id, job_id, inspection_type, preferred_date, status")
            .in("job_id", jobIds)
            .eq("status", "Pending"),
        ]);

  const events: CalendarEvent[] = [];

  for (const row of inspections || []) {
    const scheduled = ["scheduled", "reinspection_scheduled"].includes(row.status);
    const pendingStatus = ["requested", "reinspection_requested"].includes(row.status);
    const hasResult = ["passed", "failed", "partial_pass", "closed"].includes(row.status);
    const date = scheduled
      ? row.scheduled_date
      : hasResult
        ? row.result_date || row.scheduled_date
        : row.requested_date || row.scheduled_date;
    if (!date) continue;
    events.push({
      id: row.id,
      date: String(date).slice(0, 10),
      kind: scheduled ? "scheduled" : hasResult ? "result" : pendingStatus ? "pending" : "result",
      title: row.inspection_type || `Inspection ${row.slot}`,
      address: addressById.get(row.job_id) || "",
      jobId: row.job_id,
      inspectionId: row.id,
      status: row.status,
      canReport: REPORTABLE.has(row.status),
      isFinal: isFinalInspection(row),
    });
  }

  for (const req of pending || []) {
    if (!req.preferred_date) continue;
    const already = events.some(
      (ev) =>
        ev.jobId === req.job_id &&
        ev.title === req.inspection_type &&
        ev.kind === "pending" &&
        ev.date === String(req.preferred_date).slice(0, 10)
    );
    if (already) continue;
    const match = (inspections || []).find(
      (row) => row.job_id === req.job_id && row.inspection_type === req.inspection_type
    );
    events.push({
      id: `req-${req.id}`,
      date: String(req.preferred_date).slice(0, 10),
      kind: "pending",
      title: req.inspection_type || "Inspection request",
      address: addressById.get(req.job_id) || "",
      jobId: req.job_id,
      inspectionId: match?.id || "",
      status: "pending",
      canReport: Boolean(match?.id),
      isFinal: match ? isFinalInspection(match) : false,
    });
  }

  const pendingCount = events.filter((e) => e.kind === "pending").length;
  const scheduledCount = events.filter((e) => e.kind === "scheduled").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020202]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#090909]">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image src="/icons/icon-512.png" alt="Majestic Permits" width={36} height={36} className="rounded-lg" />
            <div>
              <p className="text-sm font-semibold text-[#156cdd] dark:text-white">
                {contractor.company_name || contractor.name}
              </p>
              <p className="text-xs text-slate-500">Inspections</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-[#156cdd]">
              Projects
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-[#156cdd] dark:text-white">Inspections</h1>
        <p className="mt-1 text-slate-500">
          {pendingCount} pending · {scheduledCount} scheduled. Dates land here after Majestic confirms them.
        </p>
        <div className="mt-8">
          <InspectionsMonth events={events} />
        </div>
      </main>
    </div>
  );
}
