import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { createServiceClient } from "@/lib/supabase/service";
import { ToolPage } from "@/components/contractor/tool-nav";
import { CompanyForm } from "@/components/contractor/company-form";

export const dynamic = "force-dynamic";

function flag(date: string | null) {
  if (!date) return null;
  const when = new Date(date + "T00:00:00");
  const days = Math.ceil((when.getTime() - Date.now()) / 86400000);
  if (days < 0) return "Expired";
  if (days <= 30) return `Expires in ${days} days`;
  return null;
}

export default async function CompanyPage() {
  const user = await requireUser("/dashboard/company");
  const contractor = await getContractorForUser(user);
  if (!contractor) return <p className="p-6">Account not linked.</p>;

  const service = createServiceClient();
  const { data } = await service
    .from("contractor_records")
    .select("license_number, license_expires, coi_carrier, coi_policy, coi_expires")
    .eq("contractor_id", contractor.id)
    .maybeSingle();

  const license = data?.license_expires ? String(data.license_expires).slice(0, 10) : "";
  const coi = data?.coi_expires ? String(data.coi_expires).slice(0, 10) : "";

  return (
    <ToolPage
      current="/dashboard/company"
      title="License and insurance"
      lede="Keep the company license and the certificate of insurance here. Anything expired, or inside 30 days, is flagged."
    >
      <ul className="mb-4 grid gap-2 text-sm">
        {flag(license) && <li className="rounded-xl bg-amber-950/40 px-3 py-2">License: {flag(license)}</li>}
        {flag(coi) && <li className="rounded-xl bg-amber-950/40 px-3 py-2">Insurance: {flag(coi)}</li>}
      </ul>
      <CompanyForm
        initial={{
          license_number: data?.license_number || "",
          license_expires: license,
          coi_carrier: data?.coi_carrier || "",
          coi_policy: data?.coi_policy || "",
          coi_expires: coi,
        }}
      />
    </ToolPage>
  );
}
