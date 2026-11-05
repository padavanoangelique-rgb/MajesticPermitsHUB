import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { createServiceClient } from "@/lib/supabase/service";
import { ToolPage } from "@/components/contractor/tool-nav";
import { LookupForm } from "@/components/contractor/lookup-form";

export const dynamic = "force-dynamic";

export default async function LookupPage() {
  const user = await requireUser("/dashboard/lookup");
  const contractor = await getContractorForUser(user);
  if (!contractor) return <p className="p-6">Account not linked.</p>;

  const { data: jobs } = await createServiceClient()
    .from("jobs")
    .select("id, property_address")
    .in("contractor_id", contractor.company_contractor_ids)
    .order("updated_at", { ascending: false })
    .limit(80);

  return (
    <ToolPage
      current="/dashboard/lookup"
      title="Property lookup"
      lede="Search the county property appraiser. You get the folio, the owner, the legal description and the jurisdiction that permits the property, and you can save them to a job."
    >
      <LookupForm jobs={(jobs || []) as Array<{ id: string; property_address: string }>} />
    </ToolPage>
  );
}
