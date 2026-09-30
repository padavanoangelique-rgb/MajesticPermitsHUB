import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ToolNav } from "@/components/contractor/tool-nav";
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
    <main className="mx-auto max-w-xl px-4 py-6">
      <ToolNav current="/dashboard/measure" />
      <h1 className="mt-6 text-2xl font-bold">Measure</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        On the phone, add each window and door and type the size. The sketch stays with that job.
      </p>
      <div className="mt-6">
        <MeasurePad jobs={jobs || []} initialJob={first} initialOpenings={openings} />
      </div>
    </main>
  );
}
