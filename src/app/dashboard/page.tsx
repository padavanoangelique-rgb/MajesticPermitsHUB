import { UpdateStageForm } from "@/components/admin/update-stage-form";
import { canonicalStageTitle, inspectionsAllowed } from "@/lib/stages";
import { visibleInspections, inspectionName } from "@/lib/inspection-sequence";
import Link from "next/link";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/service";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { CONTRACTOR_BUCKETS } from "@/lib/dashboard-buckets";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { JobStatusBar } from "@/components/contractor/job-status-bar";
import { ToolNav } from "@/components/contractor/tool-nav";
import { DECLINED_REQUEST_SUB, PENDING_REQUEST_SUB } from "@/lib/job-request";
import { ContractorResultForm } from "@/components/contractor/contractor-result-form";
import { isFinalInspection } from "@/lib/inspection-final";

type DashboardInspection = { id: string; job_id: string; slot: number; inspection_type: string | null; status: string; scheduled_date: string | null; result_date: string | null };

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams?: { q?: string } }) {
  const user = await requireUser("/dashboard");
  const supabase = createServiceClient();
  const q = (searchParams?.q || "").trim().toLowerCase();

  const contractor = await getContractorForUser(user);

  if (!contractor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-primary dark:text-white">Account not linked</h1>
          <p className="mt-3 text-muted-foreground">Your login works, but it is not yet linked to a contractor profile. Contact Majestic Permits.</p>
          <form action="/auth/signout" method="post" className="mt-8"><button className="text-sm text-muted-foreground underline">Sign out</button></form>
        </div>
      </div>
    );
  }

  const { data: allJobs } = await supabase
    .from("jobs")
    .select("id, property_address, stage, sub_status, permit_number, permit_eta, submitted_date, updated_at, trade_type, created_at")
    .eq("contractor_id", contractor.id)
    .order("created_at", { ascending: false });

  const pendingJobRequests = (allJobs || []).filter((j: any) => j.sub_status === PENDING_REQUEST_SUB);
  let jobs = (allJobs || []).filter((j: any) => j.sub_status !== PENDING_REQUEST_SUB && j.sub_status !== DECLINED_REQUEST_SUB);

  if (q) {
    jobs = jobs.filter((j: any) =>
      [j.property_address, j.permit_number, j.stage, j.sub_status, j.trade_type]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q))
    );
  }

  const totalJobs = jobs.length;
  const { data: inspections } = jobs.length
    ? await supabase.from("job_inspections").select("id, job_id, slot, inspection_type, status, scheduled_date, result_date").in("job_id", jobs.map((job) => job.id)).order("slot")
    : { data: [] };
  const inspectionsByJob: Record<string, DashboardInspection[]> = {};
  for (const inspection of inspections || []) {
    (inspectionsByJob[inspection.job_id] ||= []).push(inspection);
  }

  const pendingInspections = jobs.filter((j: any) =>
    (inspectionsByJob[j.id] || []).some((i) => ["scheduled", "pending", "requested", "reinspection_scheduled"].includes(i.status))
  );

  const bucketed = CONTRACTOR_BUCKETS.map((bucket) => ({
    ...bucket,
    items: jobs
      .filter((j: any) => (bucket.stageTitles as readonly string[]).includes(canonicalStageTitle(j.stage)))
      .sort((a: any, b: any) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime()),
  }));
  const bucketedIds = new Set(bucketed.flatMap((b) => b.items.map((j: any) => j.id)));
  const other = jobs.filter((j: any) => !bucketedIds.has(j.id));
  const displayOrder = ["pending_permits", "needs_install", "needs_inspection", "complete"];
  const ordered = displayOrder.map((key) => bucketed.find((b) => b.key === key)).filter(Boolean) as typeof bucketed;
  const pendingCount = ordered.find((b) => b.key === "pending_permits")?.items.length ?? 0;
  const installCount = ordered.find((b) => b.key === "needs_install")?.items.length ?? 0;
  const inspectionCount = ordered.find((b) => b.key === "needs_inspection")?.items.length ?? 0;
  const completeCount = ordered.find((b) => b.key === "complete")?.items.length ?? 0;
  const totalForProgress = pendingCount + installCount + inspectionCount + completeCount || 1;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 sticky top-0 z-10">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Image src="/icons/icon-512.png" alt="Majestic Permits" width={32} height={32} priority className="rounded-lg" />
            <div>
              <p className="text-sm font-semibold text-primary dark:text-white">{contractor.company_name || contractor.name}</p>
              <p className="text-xs text-muted-foreground">Field Job Overview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action="/auth/signout" method="post"><button className="text-xs text-muted-foreground hover:text-primary px-2 py-1 rounded-lg hover:bg-secondary">Sign out</button></form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 py-5 sm:px-6 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-primary dark:text-white">Job Management</h1>
            <p className="text-sm text-muted-foreground">{jobs.filter(j => !["Permit closed — all done", "Final inspection passed"].includes(canonicalStageTitle(j.stage))).length} active · newest first</p>
          </div>
          <Link href="/dashboard/new" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Request a job</Link>
        </div>

        <form method="get" className="mb-5">
          <input name="q" defaultValue={q} placeholder="Search address, permit #, status…" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary" />
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <a href="#pending_permits" className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-[#3b1d78] to-[#1a1038] px-4 py-4"><p className="text-xs font-semibold uppercase tracking-wider text-violet-200">Pending permits</p><p className="mt-1 text-3xl font-bold text-white">{pendingCount}</p></a>
          <a href="#needs_install" className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-[#78350f] to-[#1a1038] px-4 py-4"><p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Needs install</p><p className="mt-1 text-3xl font-bold text-white">{installCount}</p></a>
          <a href="#needs_inspection" className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-[#312e81] to-[#1a1038] px-4 py-4"><p className="text-xs font-semibold uppercase tracking-wider text-violet-200">Needs inspection</p><p className="mt-1 text-3xl font-bold text-white">{inspectionCount}</p></a>
          <a href="#complete" className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-[#064e3b] to-[#1a1038] px-4 py-4"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Complete</p><p className="mt-1 text-3xl font-bold text-white">{completeCount}</p></a>
        </div>

        <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tools</p><ToolNav /></div>

        {pendingInspections.length > 0 && (
          <section id="pending_inspections" className="mb-5 rounded-2xl border border-sky-400/30 bg-card/90">
            <header className="flex items-center gap-3 border-b border-border px-4 py-3">
              <span className="inline-flex items-center rounded-full bg-sky-950/40 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-sky-200">Pending inspections</span>
              <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">{pendingInspections.length}</span>
            </header>
            <ul className="divide-y divide-border">
              {pendingInspections.map((job: any) => (
                <li key={job.id} className="px-4 py-3">
                  <Link href={`/dashboard/projects/${job.id}#inspections`} className="text-sm font-semibold text-primary dark:text-white">{job.property_address}</Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{(inspectionsByJob[job.id] || []).filter(i => ["scheduled","pending","requested","reinspection_scheduled"].includes(i.status)).map(i => `${inspectionName(i)} · ${i.status.replace(/_/g," ")}`).join(" · ")}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {pendingJobRequests.length > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-800/40 bg-amber-950/30 px-4 py-3">
            <p className="text-sm font-semibold text-amber-200">Waiting on Majestic</p>
            <ul className="mt-1 space-y-1 text-sm text-amber-100">{pendingJobRequests.map((req: any) => <li key={req.id}>{req.property_address}{req.trade_type ? ` · ${req.trade_type}` : ""}</li>)}</ul>
          </div>
        )}

        {totalJobs === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center"><p className="font-medium text-primary dark:text-white">No projects{q ? " match search" : " yet"}</p></div>
        ) : (
          <div className="space-y-5">
            {ordered.map((bucket) => bucket.items.length > 0 && (
              <StageSection key={bucket.key} id={bucket.key} title={bucket.label} items={bucket.items} inspectionsByJob={inspectionsByJob} progress={Math.round((bucket.items.length / totalForProgress) * 100)} />
            ))}
            {other.length > 0 && <StageSection title="Other" items={other} accent="amber" inspectionsByJob={inspectionsByJob} progress={0} />}
          </div>
        )}
      </main>
    </div>
  );
}

function StageSection({ id, title, items, accent = "blue", inspectionsByJob, progress = 0 }: { id?: string; title: string; items: any[]; accent?: "blue" | "amber"; inspectionsByJob: Record<string, DashboardInspection[]>; progress?: number }) {
  const accentPill = accent === "amber" ? "bg-amber-950/30 text-amber-200" : "bg-primary/10 text-primary";
  return (
    <section id={id} className="rounded-2xl border border-violet-400/20 bg-card/90">
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider " + accentPill}>{title}</span>
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">{items.length}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </header>
      <ul className="divide-y divide-border">
        {items.map((job) => (
          <li key={job.id} className="px-4 py-3">
            <JobStatusBar stage={job.stage || job.sub_status || ""} />
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link href={`/dashboard/projects/${job.id}`} className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary dark:text-white">{job.property_address}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{job.permit_number ? `Permit ${job.permit_number}` : "No permit yet"}{job.sub_status ? ` · ${job.sub_status}` : ""}</p>
              </Link>
              <div className="flex gap-2">
                <Link href={`/dashboard/projects/${job.id}#documents`} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium">Docs</Link>
                <Link href={`/dashboard/projects/${job.id}#inspections`} className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-white">{["Permit closed — all done", "Final inspection passed"].includes(canonicalStageTitle(job.stage)) ? "View" : inspectionsAllowed(job.stage) ? "Inspect" : "View"}</Link>
              </div>
            </div>
            <details className="mt-2"><summary className="cursor-pointer text-xs text-muted-foreground">Edit status</summary><div className="mt-2"><UpdateStageForm key={`${job.stage}:${job.sub_status}`} jobId={job.id} currentStage={job.stage} currentSubStatus={job.sub_status || ""} contractor /></div></details>
            <div className="mt-2 space-y-1.5 border-t border-border pt-2">
              {visibleInspections(inspectionsByJob[job.id] || [], inspectionsAllowed(job.stage), job.stage === "Permit closed — all done").map((inspection) => (
                <div key={inspection.id} className="rounded-lg bg-secondary/40 px-2.5 py-1.5 text-xs">
                  <span className="font-medium">{inspectionName(inspection)}</span> · {inspection.status.replace(/_/g, " ")}{(inspection.result_date || inspection.scheduled_date) ? ` · ${inspection.result_date || inspection.scheduled_date}` : ""}
                  {job.stage !== "Permit closed — all done" && ["scheduled", "reinspection_scheduled"].includes(inspection.status) && (
                    <details className="mt-1"><summary className="cursor-pointer text-primary">Record result</summary><ContractorResultForm inspectionId={inspection.id} isFinal={isFinalInspection(inspection)} /></details>
                  )}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
