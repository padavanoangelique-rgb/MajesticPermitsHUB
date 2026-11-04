import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { PERMIT_FORMS } from "@/lib/permit-forms";
import { COUNTY_FORMS } from "@/lib/forms/county-forms";
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
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-violet-300">County permit applications and Notice of Commencement</h2>
      <p className="mb-3 text-sm text-muted-foreground">The county&apos;s own PDF, filled with the property, owner and your company. Download it, add what is still blank, and send it for signature.</p>
      <ul className="mb-8 grid gap-3">
        {COUNTY_FORMS.map((form) => (
          <li key={form.slug}>
            <Link href={`/dashboard/forms/pdf/${form.slug}`} className="block rounded-2xl border border-violet-400/25 px-4 py-4 hover:border-violet-300">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{form.countyName}</p>
              <p className="mt-0.5 font-semibold">{form.kind === "noc" ? "Notice of Commencement" : "Building permit application"}</p>
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-violet-300">Other forms</h2>
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
