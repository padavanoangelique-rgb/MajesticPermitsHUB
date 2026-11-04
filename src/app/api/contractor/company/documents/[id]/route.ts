import { NextResponse } from "next/server";
import { requireCompany, COMPANY_DOCS_BUCKET } from "@/lib/company-auth";
import { normalizeDocType } from "@/lib/company-docs";

export const dynamic = "force-dynamic";

async function ownDoc(gate: Extract<Awaited<ReturnType<typeof requireCompany>>, { ok: true }>, id: string) {
  const { data } = await gate.db
    .from("contractor_documents")
    .select("id, company_id, storage_path, file_name")
    .eq("id", id)
    .eq("company_id", gate.contractor.company_id)
    .maybeSingle();
  return data;
}

/** Open (or, with ?download=1, download) a document through a short-lived link. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireCompany();
  if (!gate.ok) return gate.response;
  const doc = await ownDoc(gate, params.id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const download = new URL(req.url).searchParams.get("download") === "1";
  const { data, error } = await gate.db.storage.from(COMPANY_DOCS_BUCKET).createSignedUrl(doc.storage_path, 600, download ? { download: doc.file_name } : undefined);
  if (error || !data?.signedUrl) return NextResponse.json({ error: error?.message || "Could not open the file." }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}

/** Change what a document is, its number or its expiration date. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireCompany();
  if (!gate.ok) return gate.response;
  const doc = await ownDoc(gate, params.id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if ("doc_type" in body) patch.doc_type = normalizeDocType(body.doc_type);
  if ("label" in body) patch.label = String(body.label || "").trim().slice(0, 120) || null;
  if ("doc_number" in body) patch.doc_number = String(body.doc_number || "").trim().slice(0, 80) || null;
  if ("expires_on" in body) {
    const text = typeof body.expires_on === "string" ? body.expires_on.trim().slice(0, 10) : "";
    if (text && !/^\d{4}-\d{2}-\d{2}$/.test(text)) return NextResponse.json({ error: "Enter a valid expiration date." }, { status: 400 });
    patch.expires_on = text || null;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  const { error } = await gate.db.from("contractor_documents").update(patch).eq("id", doc.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireCompany();
  if (!gate.ok) return gate.response;
  const doc = await ownDoc(gate, params.id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { error } = await gate.db.from("contractor_documents").delete().eq("id", doc.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await gate.db.storage.from(COMPANY_DOCS_BUCKET).remove([doc.storage_path]);
  return NextResponse.json({ ok: true });
}
