import { createServiceClient } from "@/lib/supabase/service";
import { Logo } from "@/components/layout/logo";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, ArrowUpDown, LayoutGrid } from "lucide-react";
import { PERMIT_STAGES, getStageOrderByTitle } from "@/lib/stages";
import { JobsFilterBar } from "@/components/admin/jobs-filter-bar";
import { AdminKpiTiles } from "@/components/admin/admin-kpi-tiles";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const dynamic = "force-dynamic";

type SortField = "updated" | "address" | "stage" | "contractor" | "eta";

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
    );

  // KPI: which jobs still have any inspection slot in "not_scheduled"
  const { data: openInspections } = await supabase
    .from("job_inspections")
    .select("job_id")
    .eq("status", "not_scheduled");
  const needsInspectionJobIds = new Set<string>(
    (openInspections || []).map((r: any) => r.job_id)
  );

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const kpiCounts = (jobs || []).reduce(
    (acc, job: any) => {
      if (job.stage === "Under review") acc.inReview += 1;
      if (job.stage === "Approved \u2014 ready to build") acc.approved += 1;
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

  const sort: SortField = (
    typeof searchParams.sort === "string" ? searchParams.sort : "updated"
  ) as SortField;
  const dir: "asc" | "desc" =
    searchParams.dir === "asc" ? "asc" : searchParams.dir === "desc" ? "desc" : sort === "updated" ? "desc" : "asc";

  const filtered = (jobs || []).filter((job: any) => {
    if (typeParam === "contractor" && job.client_type !== "contractor") return false;
    if (typeParam === "homeowner" && job.client_type !== "homeowner") return false;
    if (selectedContractorIds.length > 0) {
      if (!job.contractor_id || !selectedContractorIds.includes(job.contractor_id)) return false;
    }
    if (selectedStages.length > 0 && !selectedStages.includes(job.stage)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a: any, b: any) => {
    let cmp = 0;
    switch (sort) {
      case "stage":
        cmp = getStageOrderByTitle(a.stage) - getStageOrderByTitle(b.stage);
        break;
      case "contractor":
        cmp = (contractorMap.get(a.contractor_id) || "").localeCompare(
          contractorMap.get(b.contractor_id) || ""
        );
        break;
      case "address":
        cmp = (a.property_address || "").localeCompare(b.property_address || "");
        break;
      case "eta":
        cmp = (a.permit_eta || "").localeCompare(b.permit_eta || "");
        break;
      default:
        cmp = (a.updated_at || "").localeCompare(b.updated_at || "");
    }
    return dir === "asc" ? cmp : -cmp;
  });

  const contractorOptions = (contractors || []).map((c) => ({
    id: c.id,
    label: c.company_name || c.name || "Contractor",
  }));

  const stageOptions = PERMIT_STAGES.map((s) => ({ title: s.title, short: s.short }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
          <Logo subtitle="Admin" />

          <nav className="flex items-center gap-3">
            <Link
              href="/admin/inspections"
              className="text-sm font-medium text-slate-600 hover:text-[#156cdd] dark:text-slate-300"
            >
              Inspections
            </Link>
            <a
              href="/api/admin/report"
              className="text-sm font-medium text-slate-600 hover:text-[#156cdd] dark:text-slate-300"
            >
              Download report
            </a>
            <Link
              href="/admin/new"
              className="rounded-xl bg-[#156cdd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1157b8]"
            >
              + New Job
            </Link>
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm font-medium text-slate-500 hover:text-[#156cdd] dark:text-slate-400"
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

        <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#156cdd] dark:text-white">All Jobs</h1>
            <p className="mt-1 text-slate-500">
              {sorted.length} of {jobs?.length || 0}
              {sorted.length !== (jobs?.length || 0) ? " shown" : " total"}
            </p>
          </div>
          <Link
            href="/admin/pipeline"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
          >
            <LayoutGrid className="h-4 w-4" />
            Pipeline view
          </Link>
        </div>

        <div className="mt-6">
          <JobsFilterBar contractors={contractorOptions} stages={stageOptions} />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#111827]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/50">
              <tr>
                <SortTh field="address" label="Address" sort={sort} dir={dir} searchParams={searchParams} />
                <th className="px-5 py-3">Client</th>
                <SortTh field="contractor" label="Contractor" sort={sort} dir={dir} searchParams={searchParams} />
                <SortTh field="stage" label="Stage" sort={sort} dir={dir} searchParams={searchParams} />
                <th className="px-5 py-3">Permit #</th>
                <th className="px-5 py-3">Submitted</th>
                <SortTh field="eta" label="ETA" sort={sort} dir={dir} searchParams={searchParams} />
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.map((job: any) => (
                <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-4">
                    <p className="font-medium text-[#156cdd] dark:text-white">
                      {job.property_address}
                    </p>
                    <p className="text-xs text-slate-500">{job.homeowner_name}</p>
                  </td>
                  <td className="px-5 py-4 capitalize text-slate-600 dark:text-slate-300">
                    {job.client_type}
                    <span className="mt-0.5 block text-xs text-slate-400">{job.brand}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {contractorMap.get(job.contractor_id) || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {job.stage}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {job.permit_number || "Pending"}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {job.submitted_date
                      ? format(new Date(job.submitted_date), "MMM d, yyyy")
                      : "—"}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {job.permit_eta
                      ? format(new Date(job.permit_eta), "MMM d, yyyy")
                      : "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="text-sm font-medium text-[#156cdd] hover:underline dark:text-[#e2ba00]"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    {jobs && jobs.length > 0
                      ? "No jobs match these filters."
                      : "No jobs yet. Create your first one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function SortTh({
  field,
  label,
  sort,
  dir,
  searchParams,
}: {
  field: SortField;
  label: string;
  sort: SortField;
  dir: "asc" | "desc";
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const active = sort === field;
  const nextDir = active && dir === "asc" ? "desc" : "asc";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined || key === "sort" || key === "dir") continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else params.set(key, value);
  }
  params.set("sort", field);
  params.set("dir", nextDir);

  return (
    <th className="px-5 py-3">
      <Link
        href={`/admin?${params.toString()}`}
        className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </Link>
    </th>
  );
}
