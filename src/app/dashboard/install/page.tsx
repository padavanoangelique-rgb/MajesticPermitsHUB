import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { createServiceClient } from "@/lib/supabase/service";
import { ToolPage } from "@/components/contractor/tool-nav";
import { ensureVisitsForJobs } from "@/lib/inspection-actions";
import { currentVisit, phaseOf } from "@/lib/inspection-flow";
import { inspectionLine } from "@/lib/inspection-summary";
import { installBoardGroup, type InstallGroup } from "@/lib/stages";
import { JobStatusBar } from "@/components/contractor/job-status-bar";

export const dynamic = "force-dynamic";

const GROUPS: Array<{ key: InstallGroup; title: string; empty: string; tone: string }> = [
  { key: "scheduled_install", title: "Scheduled for install", empty: "No approved jobs are waiting to be installed.", tone: "border-amber-400/30 bg-amber-500/10 text-amber-200" },
  { key: "installing", title: "Being installed", empty: "No jobs are being installed right now.", tone: "border-orange-400/30 bg-orange-500/10 text-orange-200" },
  { key: "needs_inspection", title: "Needs inspection", empty: "No jobs are waiting on an inspection.", tone: "border-sky-400/30 bg-sky-500/10 text-sky-200" },
  { key: "needs_reinspection", title: "Needs re-inspection", empty: "No jobs need a re-inspection.", tone: "border-rose-400/30 bg-rose-500/10 text-rose-200" },
];

export default async function InstallPage() {
  const user = await requireUser("/dashboard/install");
  const contractor = await getContractorForUser(user);
  if (!contractor) return <p className="p-6">Account not linked.</p>;

  const service = createServiceClient();
  const { data: jobs } = await service
    .from("jobs")
    .select("id, property_address, stage, work_status, permit_number")
    .in("contractor_id", contractor.company_contractor_ids)
    .order("updated_at", { ascending: false });

  const list = (jobs || []) as Array<{ id: string; property_address: string; stage: string | null; work_status: string | null; permit_number: string | null }>;
  const rowsByJob = await ensureVisitsForJobs(service, list.map((j) => ({ id: j.id, stage: j.stage })));

  const byGroup = new Map<InstallGroup, typeof list>();
  const lines = new Map<string, ReturnType<typeof inspectionLine>>();
  for (const job of list) {
    const rows = rowsByJob.get(job.id) || [];
    const visit = currentVisit(rows);
    const group = installBoardGroup(job.stage, visit ? phaseOf(visit) === "needs_reinspection" : false);
    if (!group) continue;
    lines.set(job.id, inspectionLine(rows));
    byGroup.set(group, [...(byGroup.get(group) || []), job]);
  }

  return (
    <ToolPage
      current="/dashboard/install"
      title="Install board"
      lede="Approved jobs, by where they are: waiting to be installed, being installed, waiting on an inspection, or needing a re-inspection. Finished jobs are not listed."
    >
      <div className="grid gap-5">
        {GROUPS.map((group) => {
          const items = byGroup.get(group.key) || [];
          return (
            <section key={group.key}>
              <div className="mb-2 flex items-center gap-2">
                <h2 className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${group.tone}`}>{group.title}</h2>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">{items.length}</span>
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{group.empty}</p>
              ) : (
                <ul className="grid gap-3">
                  {items.map((job) => {
                    const line = lines.get(job.id);
                    return (
                      <li key={job.id} className="rounded-2xl border border-violet-400/25 bg-card/80 p-4">
                        <JobStatusBar stage={job.stage || ""} workStatus={job.work_status} flag={line?.flag} />
                        <p className="mt-3 font-semibold">{job.property_address}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{job.permit_number ? `Permit ${job.permit_number}` : "No permit number yet"}</p>
                        {line && (
                          <p className={"mt-2 text-sm " + (line.phase === "needs_reinspection" ? "text-rose-200" : line.phase === "scheduled" ? "text-sky-200" : "")}>{line.text}</p>
                        )}
                        <Link href={`/dashboard/projects/${job.id}#inspections`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-violet-300">
                          {line?.phase === "ready" ? "Request inspection" : line?.phase === "needs_reinspection" ? "Request re-inspection" : "Open inspections"}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </ToolPage>
  );
}
