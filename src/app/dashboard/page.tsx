import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
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

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const supabase = createClient();

  const contractor = await getContractorForUser(user);

  if (!contractor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-primary dark:text-white">
            Account not linked
          </h1>
          <p className="mt-3 text-muted-foreground dark:text-muted-foreground">
            Your login works, but it is not yet linked to a contractor profile.
            Please contact Majestic Permits so we can connect your account.
          </p>
          <form action="/auth/signout" method="post" className="mt-8">
            <button className="text-sm text-muted-foreground underline">Sign out</button>
          </form>
        </div>
      </div>
    );
  }

  const { data: allJobs } = await supabase
    .from("jobs")
    .select(
      "id, property_address, stage, sub_status, permit_number, permit_eta, submitted_date, updated_at, trade_type"
    )
    .eq("contractor_id", contractor.id)
    .order("updated_at", { ascending: false });

  const pendingJobRequests = (allJobs || []).filter(
    (j: any) => j.sub_status === PENDING_REQUEST_SUB
  );
  const jobs = (allJobs || []).filter(
    (j: any) =>
      j.sub_status !== PENDING_REQUEST_SUB && j.sub_status !== DECLINED_REQUEST_SUB
  );

  const totalJobs = jobs.length;
  const { data: inspections } = jobs.length
    ? await supabase.from("job_inspections")
        .select("id, job_id, slot, inspection_type, status, scheduled_date, result_date")
        .in("job_id", jobs.map((job) => job.id)).order("slot")
    : { data: [] };
  const inspectionsByJob: Record<string, DashboardInspection[]> = {};
  for (const inspection of inspections || []) {
    (inspectionsByJob[inspection.job_id] ||= []).push(inspection);
  }

  const bucketed = CONTRACTOR_BUCKETS.map((bucket) => ({
    ...bucket,
    items: jobs.filter((j: any) =>
      (bucket.stageTitles as readonly string[]).includes(j.stage)
    ),
  }));
  const bucketedIds = new Set(bucketed.flatMap((b) => b.items.map((j: any) => j.id)));
  const other = jobs.filter((j: any) => !bucketedIds.has(j.id));
  const displayOrder = ["needs_inspection", "in_review", "approved", "getting_ready", "permit_closed"];
  const ordered = displayOrder
    .map((key) => bucketed.find((bucket) => bucket.key === key))
    .filter((bucket): bucket is (typeof bucketed)[number] => Boolean(bucket));
  const reviewCount = ordered.find((bucket) => bucket.key === "in_review")?.items.length ?? 0;
  const inspectionCount = ordered.find((bucket) => bucket.key === "needs_inspection")?.items.length ?? 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80">
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-512.png"
              alt="Majestic Permits"
              width={36}
              height={36}
              priority
              className="rounded-lg"
            />
            <div>
              <p className="text-sm font-semibold text-primary dark:text-white">
                {contractor.company_name || contractor.name}
              </p>
              <p className="text-xs text-muted-foreground">Contractor Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/inspections"
              className="text-sm font-medium text-muted-foreground hover:text-primary dark:text-muted-foreground"
            >
              Inspections
            </Link>
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <button className="text-sm text-muted-foreground hover:text-primary">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
        <ToolNav />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary dark:text-white">
              Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              {totalJobs} active project{totalJobs !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/dashboard/new"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Request a job
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <a href="#in_review" className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-[#3b1d78] to-[#1a1038] px-4 py-4 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-200">Pending review</p>
            <p className="mt-1 text-3xl font-bold text-white">{reviewCount}</p>
            <p className="mt-1 text-sm text-violet-100/80">Submitted, in review, or waiting on a correction.</p>
          </a>
          <a href="#needs_inspection" className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-[#312e81] to-[#1a1038] px-4 py-4 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-200">Needs inspection</p>
            <p className="mt-1 text-3xl font-bold text-white">{inspectionCount}</p>
            <p className="mt-1 text-sm text-violet-100/80">Approved jobs that still need a visit requested.</p>
          </a>
        </div>

        {pendingJobRequests.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-800/40 bg-amber-950/30 px-5 py-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="text-sm font-semibold text-amber-200 dark:text-amber-200">
              Waiting on Majestic
            </p>
            <ul className="mt-2 space-y-1 text-sm text-amber-900 dark:text-amber-100">
              {pendingJobRequests.map((req: any) => (
                <li key={req.id}>
                  {req.property_address}
                  {req.trade_type ? ` · ${req.trade_type}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {totalJobs === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center dark:border-border dark:bg-card">
            <p className="font-medium text-primary dark:text-white">
              No projects assigned yet
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Request a job and attach documents. After Majestic approves it, the
              permit will show here with live status.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {ordered.map(
              (bucket) =>
                bucket.items.length > 0 && (
                  <StageSection
                    key={bucket.key}
                    id={bucket.key}
                    title={bucket.key === "in_review" ? "Pending review" : bucket.label}
                    items={bucket.items}
                    inspectionsByJob={inspectionsByJob}
                  />
                )
            )}
            {other.length > 0 && (
              <StageSection title="Other" items={other} accent="amber" inspectionsByJob={inspectionsByJob} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StageSection({
  id,
  title,
  items,
  accent = "blue",
  inspectionsByJob,
}: {
  id?: string;
  title: string;
  items: any[];
  accent?: "blue" | "amber";
  inspectionsByJob: Record<string, DashboardInspection[]>;
}) {
  const accentPill =
    accent === "amber"
      ? "bg-amber-950/30 text-amber-200 dark:bg-amber-950/30 dark:text-amber-300"
      : "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary";

  return (
    <section id={id} className="rounded-2xl border border-violet-400/20 bg-card/90 dark:border-violet-400/20 dark:bg-card/75">
      <header className="flex items-center gap-3 border-b border-border px-5 py-3 dark:border-border">
        <span
          className={
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider " +
            accentPill
          }
        >
          {title}
        </span>
        <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground dark:bg-secondary dark:text-muted-foreground">
          {items.length}
        </span>
      </header>
      <ul className="divide-y divide-border dark:divide-border">
        {items.map((job) => (
          <li key={job.id} className="px-4 py-4 sm:px-5">
            <JobStatusBar stage={job.stage || job.sub_status || ""} />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={`/dashboard/projects/${job.id}`}
              className="min-w-0 flex-1"
            >
              <p className="text-sm font-semibold text-primary dark:text-white">
                {job.property_address}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {job.permit_number ? `Permit ${job.permit_number}` : "No permit number yet"}
                {job.sub_status ? ` · ${job.sub_status}` : ""}
              </p>
            </Link>
            <Link
              href={`/dashboard/projects/${job.id}#inspections`}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white sm:w-auto"
            >
              {job.stage === "Permit closed — all done" ? "View inspections" : "Manage inspections"}
            </Link>
            </div>
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspection status & results</p>
              {(inspectionsByJob[job.id] || []).filter((inspection) => !["not_required", "not_requested", "cancelled"].includes(inspection.status)).map((inspection) => (
                <div key={inspection.id} className="rounded-lg bg-secondary/40 px-3 py-2">
                  <p className="text-sm"><span className="font-medium">{inspection.inspection_type || `Inspection ${inspection.slot}`}</span> · {inspection.status.replace(/_/g, " ")}
                    {(inspection.result_date || inspection.scheduled_date) ? ` · ${inspection.result_date || inspection.scheduled_date}` : ""}
                  </p>
                  {job.stage !== "Permit closed — all done" && ["scheduled", "reinspection_scheduled"].includes(inspection.status) && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-semibold text-primary">Record result{isFinalInspection(inspection) ? " / final pass" : ""}</summary>
                      <ContractorResultForm inspectionId={inspection.id} isFinal={isFinalInspection(inspection)} />
                    </details>
                  )}
                </div>
              ))}
              {!(inspectionsByJob[job.id] || []).some((inspection) => !["not_required", "not_requested", "cancelled"].includes(inspection.status)) && (
                <p className="text-xs text-muted-foreground">No inspection scheduled yet. Use Manage inspections to request a visit.</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
