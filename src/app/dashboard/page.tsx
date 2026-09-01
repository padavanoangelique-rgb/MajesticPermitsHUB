import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { DashboardViewSwitch } from "@/components/contractor/dashboard-view-switch";
import {
  PipelineBoard,
  type PipelineJob,
} from "@/components/shared/pipeline-board";
import { CONTRACTOR_BUCKETS } from "@/lib/dashboard-buckets";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const user = await requireUser("/dashboard");
  const supabase = createClient();

  const contractor = await getContractorForUser(user);

  // If no contractor record, show a friendly message
  if (!contractor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-[#020202]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#156cdd] dark:text-white">
            Account not linked
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Your login works, but it is not yet linked to a contractor profile.
            Please contact Majestic Permits so we can connect your account.
          </p>
          <form action="/auth/signout" method="post" className="mt-8">
            <button className="text-sm text-slate-500 underline">
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  const view: "list" | "pipeline" =
    searchParams.view === "pipeline" ? "pipeline" : "list";

  // Get this contractor's jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, property_address, stage, sub_status, permit_number, permit_eta, submitted_date, updated_at"
    )
    .eq("contractor_id", contractor.id)
    .order("updated_at", { ascending: false });

  const totalJobs = jobs?.length || 0;

  // Group jobs into the coarse dashboard buckets. Anything with a stage
  // that doesn't match a known title (legacy free text) lands in "Other"
  // so nothing is ever silently dropped from the list.
  const bucketed = CONTRACTOR_BUCKETS.map((bucket) => ({
    ...bucket,
    items: (jobs || []).filter((j: any) =>
      (bucket.stageTitles as readonly string[]).includes(j.stage)
    ),
  }));
  const bucketedIds = new Set(bucketed.flatMap((b) => b.items.map((j: any) => j.id)));
  const other = (jobs || []).filter((j: any) => !bucketedIds.has(j.id));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020202]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#090909]">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6">
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
              <p className="text-sm font-semibold text-[#156cdd] dark:text-white">
                {contractor.company_name || contractor.name}
              </p>
              <p className="text-xs text-slate-500">Contractor Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <button className="text-sm text-slate-500 hover:text-[#156cdd]">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#156cdd] dark:text-white">
              Your Projects
            </h1>
            <p className="mt-1 text-slate-500">
              {totalJobs} active project{totalJobs !== 1 ? "s" : ""}
            </p>
          </div>
          <DashboardViewSwitch view={view} />
        </div>

        {totalJobs === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#090909]">
            <p className="font-medium text-[#156cdd] dark:text-white">
              No projects assigned yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              As soon as Majestic Permits assigns a permit to your company, it
              will appear here with live status and inspection updates.
            </p>
          </div>
        ) : view === "pipeline" ? (
          <div className="mt-8">
            <PipelineBoard
              jobs={(jobs || []).map<PipelineJob>((j: any) => ({
                id: j.id,
                property_address: j.property_address,
                stage: j.stage,
                sub_status: j.sub_status,
                permit_number: j.permit_number,
                permit_eta: j.permit_eta,
                updated_at: j.updated_at,
              }))}
              jobHrefPrefix="/dashboard/projects"
              updateHrefTemplate="/api/contractor/jobs/{id}/stage"
              canDrag={true}
            />
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {bucketed.map(
              (bucket) =>
                bucket.items.length > 0 && (
                  <StageSection
                    key={bucket.key}
                    title={bucket.label}
                    items={bucket.items}
                  />
                )
            )}
            {other.length > 0 && (
              <StageSection title="Other" items={other} accent="amber" />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StageSection({
  title,
  items,
  accent = "blue",
}: {
  title: string;
  items: any[];
  accent?: "blue" | "amber";
}) {
  const accentPill =
    accent === "amber"
      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
      : "bg-[#156cdd]/10 text-[#156cdd] dark:bg-[#9CE824]/15 dark:text-[#9CE824]";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#090909]">
      <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
        <span
          className={
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider " +
            accentPill
          }
        >
          {title}
        </span>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {items.length}
        </span>
      </header>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((job) => (
          <li key={job.id}>
            <Link
              href={`/dashboard/projects/${job.id}`}
              className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#156cdd] dark:text-white">
                  {job.property_address}
                </p>
                {job.sub_status && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {job.sub_status}
                  </p>
                )}
              </div>
              <div className="hidden text-xs text-slate-500 sm:block">
                {job.permit_number ? (
                  <>
                    <span className="text-slate-400">Permit</span>{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {job.permit_number}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400">No permit #</span>
                )}
              </div>
              <div className="text-right text-xs text-slate-500">
                {job.permit_eta ? (
                  <>
                    <span className="text-slate-400">ETA</span>{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {format(new Date(job.permit_eta), "MMM d, yyyy")}
                    </span>
                  </>
                ) : job.updated_at ? (
                  <>
                    <span className="text-slate-400">Updated</span>{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {format(new Date(job.updated_at), "MMM d")}
                    </span>
                  </>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
