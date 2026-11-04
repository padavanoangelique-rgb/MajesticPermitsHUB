import { NextResponse } from "next/server";
import { requireCompany } from "@/lib/company-auth";

export const dynamic = "force-dynamic";

/** Mark an email-out as confirmed (the department updated the file) or take that back. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireCompany();
  if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const status = body.status === "confirmed" ? "confirmed" : body.status === "sent" ? "sent" : "";
  if (!status) return NextResponse.json({ error: "Choose confirmed or sent." }, { status: 400 });
  const { data, error } = await gate.db
    .from("contractor_doc_emails")
    .update({ status, confirmed_at: status === "confirmed" ? new Date().toISOString() : null })
    .eq("id", params.id)
    .eq("company_id", gate.contractor.company_id)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
