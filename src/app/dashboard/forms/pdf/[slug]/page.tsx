import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { createServiceClient } from "@/lib/supabase/service";
import { getCountyForm, formValueKeys, type CompanyDetails, type JobDetails } from "@/lib/forms/county-forms";
import { ToolPage } from "@/components/contractor/tool-nav";
import { CountyFormFiller, type FillerJob } from "@/components/contractor/county-form-filler";

export const dynamic = "force-dynamic";

export default async function CountyFormPage({ params, searchParams }: { params: { slug: string }; searchParams: { job?: string } }) {
  const form = getCountyForm(params.slug);
  if (!form) notFound();
  const user = await requireUser(`/dashboard/forms/pdf/${params.slug}`);
  const contractor = await getContractorForUser(user);
  if (!contractor) return <p className="p-6">Account not linked.</p>;

  const service = createServiceClient();
  const [{ data: record }, { data: company }, { data: jobs }] = await Promise.all([
    service.from("contractor_records").select("license_number").eq("contractor_id", contractor.id).maybeSingle(),
    contractor.company_id
      ? service
          .from("contractor_companies")
          .select("name, phone, email, address, city, state, zip, qualifier_name, business_tax_receipt_number")
          .eq("id", contractor.company_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    service
      .from("jobs")
      .select(
        "id, property_address, property_city, property_zip, property_unit, homeowner_name, homeowner_phone, homeowner_email, contract_value, permit_number, folio_number, legal_description, work_description",
      )
      .in("contractor_id", contractor.company_contractor_ids)
      .order("updated_at", { ascending: false })
      .limit(60),
  ]);

  const companyDetails: CompanyDetails = {
    ...((company as CompanyDetails | null) || {}),
    name: (company as CompanyDetails | null)?.name || contractor.company_name || contractor.name || "",
    phone: (company as CompanyDetails | null)?.phone || "",
    email: (company as CompanyDetails | null)?.email || contractor.email || "",
  };

  return (
    <ToolPage current="/dashboard/forms" title={form.name} lede={`${form.blurb} Pick the job, check what is filled, and download the PDF. Whatever is still blank, you or the owner write in before signing.`}>
      <CountyFormFiller
        form={{ slug: form.slug, name: form.name, kind: form.kind }}
        keys={formValueKeys(form.slug)}
        company={companyDetails}
        licenseNumber={record?.license_number || ""}
        jobs={((jobs || []) as Array<JobDetails & { id: string }>) as FillerJob[]}
        initialJobId={searchParams.job || ""}
      />
    </ToolPage>
  );
}
