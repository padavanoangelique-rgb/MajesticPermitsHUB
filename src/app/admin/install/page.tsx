import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function AdminInstallPage() {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, property_address, stage, contractor_id, permit_number")
    .order("updated_at", { ascending: false });
  const ready = (jobs || []).filter((job: any) => {
    const stage = (job.stage || "").toLowerCase();
    return stage.includes("approv") || stage.includes("inspect") || stage.includes("final");
  });
  const ids = ready.map((job: any) => job.id);
  const contractorIds = Array.from(new Set(ready.map((job: any) => job.contractor_id).filter(Boolean)));
  const [{ data: inspections }, { data: contractors }] = await Promise.all([
    ids.length
      ? supabase.from("job_inspections").select("job_id, inspection_type, status, scheduled_date, requested_date").in("job_id", ids)
      : Promise.resolve({ data: [] as any[] }),
    contractorIds.length
      ? supabase.from("contractors").select("id, company_name, name").in("id", contractorIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const company = new Map((contractors || []).map((row: any) => [row.id, row.company_name || row.name]));
  const byJob = new Map<string, any[]>();
  for (const row of inspections || []) {
    const list = byJob.get(row.job_id) || [];
    list.push(row);
    byJob.set(row.job_id, list);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin" className="text-sm text-muted-foreground">← All jobs</Link>
      <h1 className="mt-4 text-2xl font-bold">Install board</h1>
      <p className="mt-2 text-sm text-muted-foreground">The same approved jobs the contractor sees, with the inspection date on the job.</p>
      <ul className="mt-6 grid gap-3">
        {ready.length === 0 && <li className="text-sm text-muted-foreground">Nothing is ready to install.</li>}
        {ready.map((job: any) => {
          const rows = byJob.get(job.id) || [];
          const next = rows.find((row) => row.scheduled_date) || rows.find((row) => row.requested_date);
          const when = next?.scheduled_date || next?.requested_date;
          return (
            <li key={job.id} className="rounded-2xl border border-violet-400/25 bg-card/80 p-4">
              <Link href={`/admin/jobs/${job.id}`} className="font-semibold text-violet-300">{job.property_address}</Link>
              <p className="mt-1 text-sm text-muted-foreground">{company.get(job.contractor_id) || "Unassigned"} · {job.stage}</p>
              <p className="mt-2 text-sm">{when ? `${next.inspection_type || "Inspection"} · ${String(when).slice(0, 10)} · ${next.status}` : "No inspection date yet"}</p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
