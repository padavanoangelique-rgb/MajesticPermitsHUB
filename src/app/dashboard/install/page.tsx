import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ToolNav } from "@/components/contractor/tool-nav";

export const dynamic = "force-dynamic";

export default async function InstallPage() {
  const user = await requireUser("/dashboard/install");
  const contractor = await getContractorForUser(user);
  if (!contractor) return <p className="p-6">Account not linked.</p>;

  const supabase = createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, property_address, stage, permit_number")
    .eq("contractor_id", contractor.id)
    .order("updated_at", { ascending: false });

  const readyJobs = (jobs || []).filter((job) => {
    const stage = (job.stage || "").toLowerCase();
    return stage.includes("approv") || stage.includes("inspect") || stage.includes("final");
  });
  const ids = readyJobs.map((job) => job.id);
  const service = createServiceClient();
  const { data: inspections } = ids.length
    ? await service
        .from("job_inspections")
        .select("job_id, inspection_type, status, scheduled_date, requested_date")
        .in("job_id", ids)
    : { data: [] as any[] };

  const byJob = new Map<string, any[]>();
  for (const row of inspections || []) {
    const list = byJob.get(row.job_id) || [];
    list.push(row);
    byJob.set(row.job_id, list);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <ToolNav current="/dashboard/install" />
      <h1 className="mt-6 text-2xl font-bold">Install board</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Jobs that are approved or in inspections. The date is the inspection already on the job.
      </p>
      <ul className="mt-6 grid gap-3">
        {readyJobs.length === 0 && <li className="text-sm text-muted-foreground">Nothing is ready to install yet.</li>}
        {readyJobs.map((job) => {
          const rows = byJob.get(job.id) || [];
          const next = rows.find((row) => row.scheduled_date) || rows.find((row) => row.requested_date);
          const when = next?.scheduled_date || next?.requested_date;
          return (
            <li key={job.id} className="rounded-2xl border border-violet-400/25 bg-card/80 p-4">
              <p className="font-semibold">{job.property_address}</p>
              <p className="mt-1 text-sm text-muted-foreground">{job.stage}</p>
              <p className="mt-2 text-sm">
                {when
                  ? `${next.inspection_type || "Inspection"} · ${String(when).slice(0, 10)}`
                  : "No inspection date yet"}
              </p>
              <Link href={`/dashboard/projects/${job.id}#inspections`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-violet-300">
                Schedule inspection
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
