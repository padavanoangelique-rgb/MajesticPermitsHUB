import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { PERMIT_FORMS } from "@/lib/permit-forms";
import { ToolPage } from "@/components/contractor/tool-nav";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const user = await requireUser("/dashboard/forms");
  const contractor = await getContractorForUser(user);
  if (!contractor) return <p className="p-6">Account not linked.</p>;

  return (
    <ToolPage
      current="/dashboard/forms"
      title="Permit forms"
      lede="Pick a form. The company and the job fill in. The person you send it to only signs."
    >
      <ul className="grid gap-3">
        {PERMIT_FORMS.map((form) => (
          <li key={form.key}>
            <Link href={`/dashboard/forms/${form.key}`} className="block rounded-2xl border border-violet-400/25 px-4 py-4 hover:border-violet-300">
              <p className="font-semibold">{form.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{form.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </ToolPage>
  );
}
