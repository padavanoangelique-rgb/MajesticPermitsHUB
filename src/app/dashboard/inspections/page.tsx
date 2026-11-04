import { inspectionsAllowed } from "@/lib/stages";
import Link from "next/link";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/service";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { InspectionsMonth, type CalendarEvent, type NeedsInspection } from "@/components/contractor/inspections-month";
import { ensureVisitsForJobs } from "@/lib/inspection-actions";
import { isoDay, jobsNeedingInspection, phaseOf, visitName, type InspectionRow } from "@/lib/inspection-flow";
import { upcomingInspectionDates } from "@/lib/next-inspection-day";

export const dynamic = "force-dynamic";

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `$${n.toFixed(2)}` : "";
}

export default async function ContractorInspectionsPage() {
  const user = await requireUser("/dashboard/inspections");
  const contractor = await getContractorForUser(user);

  if (!contractor) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Account not linked.</p>
      </div>
    );
  }

  const service = createServiceClient();
  const { data: jobs } = await service
    .from("jobs")
    .select("id, property_address, stage")
    .in("contractor_id", contractor.company_contractor_ids);

  const jobList = (jobs || []) as Array<{ id: string; property_address: string; stage: string | null }>;
  const addressById = new Map(jobList.map((j) => [j.id, j.property_address]));
  const rowsByJob = await ensureVisitsForJobs(service, jobList.map((j) => ({ id: j.id, stage: j.stage })));

  // The calendar shows what the contractor is allowed to know: requests are pending until Majestic confirms them.
  const events: CalendarEvent[] = [];
  for (const [jobId, rows] of Array.from(rowsByJob.entries())) {
    for (const row of rows as InspectionRow[]) {
      const phase = phaseOf(row);
      const base = { id: row.id, title: visitName(row), address: addressById.get(jobId) || "", jobId };
      if (phase === "requested" || phase === "tentative") {
        const date = isoDay(row.requested_date);
        if (date) events.push({ ...base, date, kind: "pending", detail: "Waiting for Majestic to confirm a date." });
      } else if (phase === "scheduled") {
        const bits = [
          row.inspection_time ? `Time ${row.inspection_time}` : "",
          row.inspector_name ? `Inspector ${row.inspector_name}${row.inspector_number ? ` (${row.inspector_number})` : ""}` : "",
          row.day_notes || "",
        ].filter(Boolean);
        events.push({ ...base, date: isoDay(row.scheduled_date), kind: "scheduled", detail: bits.join(" · ") });
      } else if (phase === "passed" && row.result_date) {
        events.push({ ...base, date: isoDay(row.result_date), kind: "passed", detail: row.correction_notes ? `Inspector notes: ${row.correction_notes}` : "" });
      } else if (phase === "needs_reinspection" && row.result_date) {
        const fee = money(row.reinspection_fee);
        events.push({
          ...base,
          date: isoDay(row.result_date),
          kind: "failed",
          detail: [row.correction_notes ? `Inspector notes: ${row.correction_notes}` : "", fee && row.reinspection_fee_status === "due" ? `Re-inspection fee due: ${fee}` : ""].filter(Boolean).join(" · "),
        });
      }
    }
  }

  const needs: NeedsInspection[] = jobsNeedingInspection(jobList, rowsByJob, (job) => inspectionsAllowed(job.stage))
    .filter((entry) => entry.phase === "ready" || entry.phase === "needs_reinspection")
    .map((entry) => ({
      jobId: entry.job.id,
      address: entry.job.property_address,
      slot: entry.visit.slot,
      title: visitName(entry.visit),
      reinspection: entry.phase === "needs_reinspection",
      note: entry.phase === "needs_reinspection" && entry.visit.reinspection_fee_status === "due" && money(entry.visit.reinspection_fee) ? `${money(entry.visit.reinspection_fee)} fee due` : "",
    }));

  const pendingCount = events.filter((e) => e.kind === "pending").length;
  const scheduledCount = events.filter((e) => e.kind === "scheduled").length;
  const allowedDates = upcomingInspectionDates(120).map((o) => o.value);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card dark:border-border dark:bg-card">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image src="/icons/icon-512.png" alt="Majestic Permits" width={36} height={36} className="rounded-lg" />
            <div>
              <p className="text-sm font-semibold text-primary dark:text-white">{contractor.company_name || contractor.name}</p>
              <p className="text-xs text-muted-foreground">Inspections</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Projects
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-primary dark:text-white">Inspections</h1>
        <p className="mt-1 text-muted-foreground">
          {pendingCount} pending · {scheduledCount} scheduled · {needs.length} {needs.length === 1 ? "job needs" : "jobs need"} an inspection. Dates land on your schedule after Majestic confirms them.
        </p>
        <div className="mt-8">
          <InspectionsMonth events={events} needs={needs} allowedDates={allowedDates} />
        </div>
      </main>
    </div>
  );
}
