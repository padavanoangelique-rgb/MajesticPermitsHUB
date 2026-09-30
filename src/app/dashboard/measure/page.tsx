import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ToolPage } from "@/components/contractor/tool-nav";
import { MeasurePad } from "@/components/contractor/measure-pad";

export const dynamic = "force-dynamic";

export default async function MeasurePage({ searchParams }: { searchParams: { job?: string } }) {
  const user = await requireUser("/dashboard/measure");
  const contractor = await getContractorForUser(user);
  if (!contractor) return <p className="p-6">Account not linked.</p>;

  const supabase = createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, property_address")
    .eq("contractor_id", contractor.id)
    .order("updated_at", { ascending: false })
    .limit(40);

  const first = searchParams.job || jobs?.[0]?.id || "";
  const service = createServiceClient();
  const { data: saved } = first
    ? await service.from("job_measures").select("openings").eq("job_id", first).maybeSingle()
    : { data: null };

  const openings = Array.isArray(saved?.openings) ? saved.openings : [];

  return (
    <ToolPage
      current="/dashboard/measure"
      title="Measure"
      lede="Add each window and door, type the size, and it stays on that job. Made for a phone."
    >
      <MeasurePad jobs={jobs || []} initialJob={first} initialOpenings={openings} />
    </ToolPage>
  );
}
