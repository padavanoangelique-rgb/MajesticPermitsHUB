import Link from "next/link";
import { AdminLinks } from "@/components/admin/admin-links";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

function flag(date: string | null) {
  if (!date) return "Not on file";
  const when = new Date(date.slice(0, 10) + "T00:00:00");
  const days = Math.ceil((when.getTime() - Date.now()) / 86400000);
  if (Number.isNaN(days)) return "Not on file";
  if (days < 0) return `Expired ${date.slice(0, 10)}`;
  if (days <= 30) return `Expires ${date.slice(0, 10)}`;
  return `Good through ${date.slice(0, 10)}`;
}

export default async function AdminContractorsPage() {
  await requireAdmin();
  const supabase = createServiceClient();
  const [{ data: contractors }, { data: records }, { data: jobs }] = await Promise.all([
    supabase.from("contractors").select("id, name, company_name, email").order("company_name"),
    supabase.from("contractor_records").select("contractor_id, license_number, license_expires, coi_carrier, coi_policy, coi_expires"),
    supabase.from("jobs").select("id, contractor_id, property_address").order("updated_at", { ascending: false }),
  ]);
  const fileById = new Map((records || []).map((row: any) => [row.contractor_id, row]));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <AdminLinks current="/admin/contractors" />
      <h1 className="mt-6 text-2xl font-bold">Contractor files</h1>
      <p className="mt-2 text-sm text-muted-foreground">License and insurance the contractor saved, mapped to their jobs.</p>
      <ul className="mt-6 grid gap-3">
        {(contractors || []).map((contractor: any) => {
          const file = fileById.get(contractor.id);
          const theirs = (jobs || []).filter((job: any) => job.contractor_id === contractor.id).slice(0, 5);
          return (
            <li key={contractor.id} className="rounded-2xl border border-violet-400/25 bg-card/80 p-4">
              <p className="font-semibold">{contractor.company_name || contractor.name}</p>
              <p className="text-sm text-muted-foreground">{contractor.email}</p>
              <p className="mt-2 text-sm">License {file?.license_number || "not on file"} · {flag(file?.license_expires || null)}</p>
              <p className="text-sm">Insurance {file?.coi_carrier || "not on file"}{file?.coi_policy ? ` · ${file.coi_policy}` : ""} · {flag(file?.coi_expires || null)}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {theirs.map((job: any) => (
                  <li key={job.id}>
                    <Link href={`/admin/jobs/${job.id}`} className="text-violet-300">{job.property_address}</Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
