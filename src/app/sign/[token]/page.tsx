import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { getPermitForm } from "@/lib/permit-forms";
import { SignPad } from "@/components/contractor/sign-pad";

export const dynamic = "force-dynamic";

export default async function SignPage({ params }: { params: { token: string } }) {
  const service = createServiceClient();
  const { data } = await service
    .from("contractor_form_sends")
    .select("form_key, fields, status, signed_name, signed_at")
    .eq("token", params.token)
    .maybeSingle();
  if (!data) notFound();
  const form = getPermitForm(data.form_key);
  const fields = (data.fields || {}) as Record<string, string>;

  return (
    <main className="mx-auto max-w-xl bg-white px-4 py-8 text-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Majestic Permits</p>
      <h1 className="mt-2 text-2xl font-bold">{form?.name || "Form"}</h1>
      <p className="mt-2 text-sm text-slate-600">This form is already filled. Read it, then sign at the bottom.</p>
      <dl className="mt-6 grid gap-3">
        {form?.fields.map((field) => (
          <div key={field.key}>
            <dt className="text-xs uppercase tracking-wide text-slate-500">{field.label}</dt>
            <dd className="whitespace-pre-wrap text-base">{fields[field.key] || "—"}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8">
        {data.status === "signed" ? (
          <p className="font-semibold">Signed by {data.signed_name}.</p>
        ) : (
          <SignPad token={params.token} />
        )}
      </div>
    </main>
  );
}
