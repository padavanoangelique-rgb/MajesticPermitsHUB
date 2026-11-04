import { inspectionsAllowed } from "@/lib/stages";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth-guard";
import { MarkHandledButton } from "@/components/admin/mark-handled-button";
import { InspectionPlanner, type PlannerNeed, type PlannerVisit } from "@/components/admin/inspection-planner";
import { ensureVisitsForJobs } from "@/lib/inspection-actions";
import { isFinalVisit, isoDay, jobsNeedingInspection, phaseOf, visitName } from "@/lib/inspection-flow";

export const dynamic = "force-dynamic";

export default async function InspectionsPage({
  searchParams,
}: {
  searchParams: { embed?: string };
}) {
  await requireAdmin();
  const embed = searchParams?.embed === "1";
  const db = createServiceClient();

  const { data: jobs } = await db.from("jobs").select("id, property_address, homeowner_name, contractor_id, stage");
  const jobList = (jobs || []) as Array<{ id: string; property_address: string | null; homeowner_name: string | null; contractor_id: string | null; stage: string | null }>;
  const { data: contractors } = await db.from("contractors").select("id, name, company_name");
  const contractorName = new Map((contractors || []).map((c: any) => [c.id, c.company_name || c.name || "Contractor"]));

  // Approved jobs get the standard visits turned on, so every one of them can be scheduled from here.
  const rowsByJob = await ensureVisitsForJobs(db, jobList.map((j) => ({ id: j.id, stage: j.stage })));
  const jobById = new Map(jobList.map((j) => [j.id, j]));

  const visits: PlannerVisit[] = [];
  for (const [jobId, rows] of Array.from(rowsByJob.entries())) {
    const job = jobById.get(jobId);
    if (!job) continue;
    for (const row of rows) {
      const phase = phaseOf(row);
      if (phase === "unavailable" || phase === "ready") continue;
      const fee = Number(row.reinspection_fee);
      visits.push({
        id: row.id,
        jobId,
        address: job.property_address || "Unknown address",
        contractor: (job.contractor_id && contractorName.get(job.contractor_id)) || job.homeowner_name || "Homeowner",
        name: visitName(row),
        isFinal: isFinalVisit(row),
        phase,
        requestedDate: isoDay(row.requested_date),
        scheduledDate: isoDay(row.scheduled_date),
        resultDate: isoDay(row.result_date),
        time: row.inspection_time || "",
        inspector: row.inspector_name || "",
        inspectorNumber: row.inspector_number || "",
        dayNotes: row.day_notes || "",
        resultNotes: row.correction_notes || "",
        fee: Number.isFinite(fee) && fee > 0 ? fee : null,
        feeStatus: row.reinspection_fee_status || null,
      });
    }
  }

  const needs: PlannerNeed[] = jobsNeedingInspection(jobList, rowsByJob, (job) => inspectionsAllowed(job.stage)).map((entry) => ({
    visitId: entry.visit.id,
    jobId: entry.job.id,
    address: entry.job.property_address || "Unknown address",
    contractor: (entry.job.contractor_id && contractorName.get(entry.job.contractor_id)) || entry.job.homeowner_name || "Homeowner",
    name: visitName(entry.visit),
    phase: entry.phase as PlannerNeed["phase"],
    requestedDate: isoDay(entry.visit.requested_date),
  }));

  // Requests that came in through the older homeowner form have no visit behind them yet.
  const { data: legacy } = await db
    .from("inspection_requests")
    .select("id, job_id, inspection_type, notes, preferred_date, created_at")
    .eq("status", "Pending")
    .order("created_at", { ascending: false });
  const legacyRows = (legacy || []).filter((r: any) => !(r.job_id && rowsByJob.get(r.job_id)?.some((row) => ["requested", "reinspection_requested"].includes(row.status))));

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
  const scheduledCount = visits.filter((v) => v.phase === "scheduled" || v.phase === "tentative").length;
  const needsResult = visits.filter((v) => v.phase === "scheduled" && v.scheduledDate && v.scheduledDate <= today).length;

  return (
    <div className="min-h-screen bg-background">
      <main className={embed ? "px-4 py-6 sm:px-6" : "mx-auto max-w-6xl px-4 py-10 sm:px-6"}>
        <h1 className="text-2xl font-bold text-primary">Inspection calendar</h1>
        <p className="mt-1 text-muted-foreground">
          {needs.length} {needs.length === 1 ? "job needs" : "jobs need"} an inspection · {scheduledCount} on the calendar · {needsResult} {needsResult === 1 ? "needs" : "need"} a result.
          Click a day, add a job to it, confirm it to tell the contractor, then record the result.
        </p>

        <InspectionPlanner visits={visits} needs={needs} />

        {legacyRows.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold text-primary">Other requests</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sent through the older request form. Mark them scheduled here, or open the job to set its inspections up.</p>
            <div className="mt-4 space-y-3">
              {legacyRows.map((req: any) => (
                <div key={req.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-semibold">{(req.job_id && jobById.get(req.job_id)?.property_address) || "Unknown address"}</p>
                    <p className="text-xs text-muted-foreground">{req.inspection_type || "Inspection"}{req.preferred_date ? ` · ${String(req.preferred_date).slice(0, 10)}` : ""}</p>
                    {req.notes && <p className="mt-1 text-xs text-muted-foreground">{req.notes}</p>}
                  </div>
                  <MarkHandledButton id={req.id} status="Scheduled" label="Schedule + notify" preferredDate={req.preferred_date} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
