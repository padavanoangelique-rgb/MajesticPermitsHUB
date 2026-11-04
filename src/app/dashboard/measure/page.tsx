import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { createServiceClient } from "@/lib/supabase/service";
import { ToolPage } from "@/components/contractor/tool-nav";
import { MeasurePad } from "@/components/contractor/measure-pad";

export const dynamic = "force-dynamic";

export default async function MeasurePage({ searchParams }: { searchParams: { job?: string } }) {
  const user = await requireUser("/dashboard/measure");
  const contractor = await getContractorForUser(user);
  if (!contractor) return <p className="p-6">Account not linked.</p>;

  const service = createServiceClient();
  const { data: jobs } = await service
    .from("jobs")
    .select("id, property_address")
    .in("contractor_id", contractor.company_contractor_ids)
    .order("updated_at", { ascending: false })
    .limit(40);

  const first = searchParams.job || jobs?.[0]?.id || "";
  const { data: saved } = first
    ? await service.from("job_measures").select("openings").eq("job_id", first).maybeSingle()
    : { data: null };

  const openings = Array.isArray(saved?.openings) ? saved.openings : [];

  return (
    <ToolPage
      current="/dashboard/measure"
      title="Measure"
      lede="Draw the floor plan with your finger. Walls snap straight. Add windows and doors."
    >
      <MeasurePad jobs={jobs || []} initialJob={first} initialOpenings={openings} />
    </ToolPage>
  );
}
