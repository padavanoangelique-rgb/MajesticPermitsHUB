import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { ToolNav } from "@/components/contractor/tool-nav";
import { LookupForm } from "@/components/contractor/lookup-form";

export const dynamic = "force-dynamic";

export default async function LookupPage() {
  const user = await requireUser("/dashboard/lookup");
  const contractor = await getContractorForUser(user);
  if (!contractor) return <p className="p-6">Account not linked.</p>;

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <ToolNav current="/dashboard/lookup" />
      <h1 className="mt-6 text-2xl font-bold">Property appraiser</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Look up the house on the county appraiser. That is the official record for the owner and the parcel.
      </p>
      <div className="mt-6">
        <LookupForm />
      </div>
    </main>
  );
}
