import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPermitForm } from "@/lib/permit-forms";
import { ToolNav } from "@/components/contractor/tool-nav";
import { FormFiller } from "@/components/contractor/form-filler";

export const dynamic = "force-dynamic";

export default async function FormFillPage({ params }: { params: { key: string } }) {
  const form = getPermitForm(params.key);
  if (!form) notFound();
  const user = await requireUser(`/dashboard/forms/${params.key}`);
  const contractor = await getContractorForUser(user);
  if (!contractor) return <p className="p-6">Account not linked.</p>;

  const service = createServiceClient();
  const supabase = createClient();
  const [{ data: record }, { data: jobs }] = await Promise.all([
    service
      .from("contractor_records")
      .select("license_number")
      .eq("contractor_id", contractor.id)
      .maybeSingle(),
    supabase
      .from("jobs")
      .select("id, property_address, permit_number")
      .eq("contractor_id", contractor.id)
      .order("updated_at", { ascending: false })
      .limit(40),
  ]);

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <ToolNav current="/dashboard/forms" />
      <h1 className="mt-6 text-2xl font-bold">{form.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{form.blurb}</p>
      <div className="mt-6">
        <FormFiller
          form={form}
          company={{
            company_name: contractor.company_name || contractor.name || "",
            license_number: record?.license_number || "",
          }}
          jobs={(jobs || []).map((job) => ({
            id: job.id,
            property_address: job.property_address,
            permit_number: job.permit_number,
          }))}
        />
      </div>
    </main>
  );
}
