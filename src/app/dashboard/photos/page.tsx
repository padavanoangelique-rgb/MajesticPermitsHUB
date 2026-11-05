import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { createServiceClient } from "@/lib/supabase/service";
import { ToolPage } from "@/components/contractor/tool-nav";
import { PhotoJobPicker } from "@/components/contractor/photo-job-picker";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const user = await requireUser("/dashboard/photos");
  const contractor = await getContractorForUser(user);
  if (!contractor) return <p className="p-6">Account not linked.</p>;

  const { data: jobs } = await createServiceClient()
    .from("jobs")
    .select("id, property_address, homeowner_name")
    .in("contractor_id", contractor.company_contractor_ids)
    .order("updated_at", { ascending: false })
    .limit(80);

  return (
    <ToolPage
      current="/dashboard/photos"
      title="Photos"
      lede="Take photos on site, label the room and add a note to each. You get a numbered PDF, and you can save it straight to the job."
    >
      <PhotoJobPicker
        takenBy={contractor.company_name || contractor.name || ""}
        jobs={((jobs || []) as Array<{ id: string; property_address: string; homeowner_name: string | null }>).map((job) => ({
          id: job.id,
          address: job.property_address,
          name: job.homeowner_name || "",
        }))}
      />
    </ToolPage>
  );
}
