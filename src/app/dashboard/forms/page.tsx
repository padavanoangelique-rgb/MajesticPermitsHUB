import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { PERMIT_FORMS } from "@/lib/permit-forms";
import { ToolNav } from "@/components/contractor/tool-nav";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const user = await requireUser("/dashboard/forms");
  const contractor = await getContractorForUser(user);
  if (!contractor) return <p className="p-6">Account not linked.</p>;

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <ToolNav current="/dashboard/forms" />
      <h1 className="mt-6 text-2xl font-bold">Permit forms</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Fill the form with the company and the job. Then send a link. The other person only has to sign.
      </p>
      <ul className="mt-6 grid gap-3">
        {PERMIT_FORMS.map((form) => (
          <li key={form.key}>
            <Link href={`/dashboard/forms/${form.key}`} className="block rounded-2xl border border-violet-400/25 bg-card/80 p-4">
              <p className="font-semibold">{form.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{form.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
