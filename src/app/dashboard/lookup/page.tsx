import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { ToolPage } from "@/components/contractor/tool-nav";
import { LookupForm } from "@/components/contractor/lookup-form";

export const dynamic = "force-dynamic";

export default async function LookupPage() {
  const user = await requireUser("/dashboard/lookup");
  const contractor = await getContractorForUser(user);
  if (!contractor) return <p className="p-6">Account not linked.</p>;

  return (
    <ToolPage
      current="/dashboard/lookup"
      title="Property lookup"
      lede="Pick the county and the street. It opens the official appraiser for that house."
    >
      <LookupForm />
    </ToolPage>
  );
}
