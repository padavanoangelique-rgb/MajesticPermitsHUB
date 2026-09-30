import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth-guard";
import { getPermitForm } from "@/lib/permit-forms";

export const dynamic = "force-dynamic";

export default async function AdminFormsPage() {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data: sends } = await supabase
    .from("contractor_form_sends")
    .select("id, contractor_id, job_id, form_key, status, signer_email, signed_name, token, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const contractorIds = Array.from(new Set((sends || []).map((row: any) => row.contractor_id).filter(Boolean)));
  const jobIds = Array.from(new Set((sends || []).map((row: any) => row.job_id).filter(Boolean)));
  const [{ data: contractors }, { data: jobs }] = await Promise.all([
    contractorIds.length
      ? supabase.from("contractors").select("id, company_name, name").in("id", contractorIds)
      : Promise.resolve({ data: [] as any[] }),
    jobIds.length
      ? supabase.from("jobs").select("id, property_address").in("id", jobIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const company = new Map((contractors || []).map((row: any) => [row.id, row.company_name || row.name]));
  const address = new Map((jobs || []).map((row: any) => [row.id, row.property_address]));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin" className="text-sm text-muted-foreground">← All jobs</Link>
      <h1 className="mt-4 text-2xl font-bold">Forms sent for signature</h1>
      <p className="mt-2 text-sm text-muted-foreground">Every form a contractor filled. Signed ones stay on the job.</p>
      <ul className="mt-6 grid gap-3">
        {(sends || []).length === 0 && <li className="text-sm text-muted-foreground">None yet.</li>}
        {(sends || []).map((send: any) => (
          <li key={send.id} className="rounded-2xl border border-violet-400/25 bg-card/80 p-4 text-sm">
            <p className="font-semibold">{getPermitForm(send.form_key)?.name || send.form_key}</p>
            <p className="text-muted-foreground">{company.get(send.contractor_id) || "Contractor"}</p>
            <p className="mt-1">{send.status === "signed" ? `Signed by ${send.signed_name}` : "Waiting on a signature"}</p>
            {send.job_id && (
              <Link href={`/admin/jobs/${send.job_id}`} className="mt-2 inline-flex text-violet-300">
                {address.get(send.job_id) || "Open the job"}
              </Link>
            )}
            <Link href={`/sign/${send.token}`} className="mt-1 block text-violet-300">Open the form</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
