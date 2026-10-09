import { canonicalStageTitle } from "@/lib/stages";
import { UpdateStageForm } from "@/components/admin/update-stage-form";
import { createServiceClient } from "@/lib/supabase/service";
import { Logo } from "@/components/layout/logo";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { format } from "date-fns";
import { LayoutGrid } from "lucide-react";
import { PERMIT_STAGES } from "@/lib/stages";
import { CONTRACTOR_BUCKETS } from "@/lib/dashboard-buckets";
import { JobsFilterBar } from "@/components/admin/jobs-filter-bar";
import { AdminKpiTiles } from "@/components/admin/admin-kpi-tiles";
import { NotificationBell } from "@/components/admin/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AdminLinks } from "@/components/admin/admin-links";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AdminPage({ searchParams }: PageProps) {
  await requireAdmin();

  const supabase = createServiceClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, property_address, client_type, brand, stage, sub_status, permit_number, submitted_date, permit_eta, homeowner_name, updated_at, contractor_id"
    )
    .order("updated_at", { ascending: false });

  const { data: openInspections } = await supabase
    .from("job_inspections")
    .select("job_id")
    .in("status", ["requested", "reinspection_requested"]);
  const needsInspectionJobIds = new Set<string>(
    (openInspections || []).map((r: any) => r.job_id)
  );

  const { data: pendingRequests } = await supabase
    .from("inspection_requests")
    .select("job_id")
    .eq("status", "Pending");
  const pendingInspectionJobIds = new Set<string>(
    (pendingRequests || []).map((r: any) => r.job_id)
  );

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const kpiCounts = (jobs || []).reduce(
    (acc, job: any) => {
      if (job.stage === "Under review") acc.inReview += 1;
      if (job.stage === "Approved — ready to build") acc.approved += 1;
      if (needsInspectionJobIds.has(job.id)) acc.needsInspection += 1;
      if (job.updated_at && new Date(job.updated_at) < sevenDaysAgo)
        acc.needsFollowUp += 1;
      return acc;
    },
    { inReview: 0, approved: 0, needsInspection: 0, needsFollowUp: 0 }
  );

  const { data: contractors } = await supabase
    .from("contractors")
    .select("id, name, company_name")
    .order("company_name", { ascending: true });

  const contractorMap = new Map(
    (contractors || []).map((c) => [c.id, c.company_name || c.name || "Contractor"])
  );

  const typeParam = typeof searchParams.type === "string" ? searchParams.type : "all";
  const contractorParam =
    typeof searchParams.contractor === "string" ? searchParams.contractor : "";
  const selectedContractorIds = contractorParam ? contractorParam.split(",").filter(Boolean) : [];
  const stageParam = typeof searchParams.stage === "string" ? searchParams.stage : "";
  const selectedStages = stageParam ? stageParam.split(",").filter(Boolean) : [];

  const filtered = (jobs || []).filter((job: any) => {
    if (typeParam === "contractor" && job.client_type !== "contractor") return false;
    if (typeParam === "homeowner" && job.client_type !== "homeowner") return false;
    if (selectedContractorIds.length > 0) {
      if (!job.contractor_id || !selectedContractorIds.includes(job.contractor_id)) return false;
    }
    if (selectedStages.length > 0 && !selectedStages.includes(canonicalStageTitle(job.stage))) return false;
    return true;
  });

  const bucketed = CONTRACTOR_BUCKETS.map((bucket) => ({
    ...bucket,
    items: filtered.filter((j: any) =>
      (bucket.stageTitles as readonly string[]).includes(canonicalStageTitle(j.stage))
    ),
  }));
  const bucketedIds = new Set(bucketed.flatMap((b) => b.items.map((j: any) => j.id)));
  const other = filtered.filter((j: any) => !bucketedIds.has(j.id));

  const contractorOptions = (contractors || []).map((c) => ({
    id: c.id,
    label: c.company_name || c.name || "Contractor",
  }));

  const stageOptions = PERMIT_STAGES.map((s) => ({ title: s.title, short: s.short }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card dark:border-border dark:bg-card">
        <div className="mx-auto flex min-h-16 max-w-screen-2xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo subtitle="Admin" />

          <nav className="flex flex-wrap items-center justify-end gap-3">
            <Link
              href="/admin/inspections"
              className="text-sm font-medium text-muted-foreground hover:text-primary dark:text-muted-foreground"
            >
              Inspections
            </Link>
            <Link
              href="/admin/job-requests"
              className="text-sm font-medium text-muted-foreground hover:text-primary dark:text-muted-foreground"
            >
              Job requests
            </Link>
            <a
              href="/api/admin/report"
              className="text-sm font-medium text-muted-foreground hover:text-primary dark:text-muted-foreground"
            >
              Download report
            </a>
            <Link
              href="/admin/new"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
            >
              + New Job
            </Link>
            <NotificationBell />
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm font-medium text-muted-foreground hover:text-primary dark:text-muted-foreground"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6">
        <AdminKpiTiles
          inReview={kpiCounts.inReview}
          approved={kpiCounts.approved}
          needsInspection={kpiCounts.needsInspection}
          needsFollowUp={kpiCounts.needsFollowUp}
        />
        <div className="mt-6">
          <AdminLinks />
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary dark:text-white">All Jobs</h1>
            <p className="mt-1 text-muted-foreground">
              {filtered.length} of {jobs?.length || 0}
              {filtered.length !== (jobs?.length || 0) ? " shown" : " total"}
            </p>
          </div>
          <Link
            href="/admin/pipeline"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:border-border dark:border-border dark:bg-card dark:text-foreground"
          >
            <LayoutGrid className="h-4 w-4" />
            Pipeline view
          </Link>
        </div>

        <div className="mt-6">
          <JobsFilterBar contractors={contractorOptions} stages={stageOptions} />
        </div>

        <div className="mt-6 space-y-6">
          {bucketed.map(
            (bucket) =>
              bucket.items.length > 0 && (
                <AdminStageSection
                  key={bucket.key}
                  title={bucket.label}
                  items={bucket.items}
                  contractorMap={contractorMap}
                  pendingInspectionJobIds={pendingInspectionJobIds}
                />
              )
          )}
          {other.length > 0 && (
            <AdminStageSection
              title="Other"
              items={other}
              contractorMap={contractorMap}
              pendingInspectionJobIds={pendingInspectionJobIds}
              accent="amber"
            />
          )}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center dark:border-border dark:bg-card">
              <p className="text-muted-foreground">
                {jobs && jobs.length > 0
                  ? "No jobs match these filters."
                  : "No jobs yet. Create your first one."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function AdminStageSection({
  title,
  items,
  contractorMap,
  pendingInspectionJobIds,
  accent = "blue",
}: {
  title: string;
  items: any[];
  contractorMap: Map<string, string>;
  pendingInspectionJobIds: Set<string>;
  accent?: "blue" | "amber";
}) {
  const accentPill =
    accent === "amber"
      ? "bg-amber-950/30 text-amber-200 dark:bg-amber-950/30 dark:text-amber-300"
      : "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary";

  return (
    <section className="rounded-2xl border border-border bg-card dark:border-border dark:bg-card">
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
        {items.map((job: any) => {
          const needsInspection = pendingInspectionJobIds.has(job.id);
          return (
            <li key={job.id}>
              <Link
                href={`/admin/jobs/${job.id}`}
                className={
                  "flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-secondary dark:hover:bg-secondary/40" +
                  (needsInspection ? " bg-amber-950/20 dark:bg-amber-950/20" : "")
                }
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-primary dark:text-white">
                      {job.property_address}
                    </p>
                    {needsInspection && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200 dark:bg-amber-900/40 dark:text-amber-300">
                        Inspection needed
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {job.brand}
                    {job.homeowner_name ? ` · ${job.homeowner_name}` : ""}
                  </p>
                </div>
                <div className="hidden w-36 truncate text-xs text-muted-foreground sm:block">
                  {contractorMap.get(job.contractor_id) || "—"}
                </div>
                <div className="hidden w-28 text-xs text-muted-foreground md:block">
                  {job.permit_number || "Pending"}
                </div>
                <div className="w-32 text-right text-xs text-muted-foreground">
                  {job.permit_eta ? (
                    <>
                      <span className="text-muted-foreground">ETA</span>{" "}
                      <span className="font-medium text-foreground dark:text-muted-foreground">
                        {format(new Date(job.permit_eta), "MMM d, yyyy")}
                      </span>
                    </>
                  ) : job.submitted_date ? (
                    <>
                      <span className="text-muted-foreground">Submitted</span>{" "}
                      <span className="font-medium text-foreground dark:text-muted-foreground">
                        {format(new Date(job.submitted_date), "MMM d, yyyy")}
                      </span>
                    </>
                  ) : null}
                </div>
              </Link>
              <details className="px-5 pb-4"><summary className="cursor-pointer text-sm font-semibold text-primary">Edit permit status</summary><div className="mt-3"><UpdateStageForm key={`${job.stage}:${job.sub_status}`} jobId={job.id} currentStage={job.stage} currentSubStatus={job.sub_status || ""} /></div></details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
