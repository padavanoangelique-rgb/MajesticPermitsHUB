import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireCompany, COMPANY_DOCS_BUCKET } from "@/lib/company-auth";
import { ALLOWED_DOC_MIME, MAX_DOC_BYTES, normalizeDocType, safeFileName } from "@/lib/company-docs";

export const dynamic = "force-dynamic";

function cleanDate(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim().slice(0, 10) : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

/** Add a company document: the file, what it is, its number and its own expiration date. */
export async function POST(req: Request) {
  const gate = await requireCompany();
  if (!gate.ok) return gate.response;
  const { contractor, db, userId } = gate;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  if (file.size > MAX_DOC_BYTES) return NextResponse.json({ error: "That file is over 10 MB." }, { status: 400 });
  if (file.type && !ALLOWED_DOC_MIME.includes(file.type)) return NextResponse.json({ error: "Upload a PDF or an image (PNG, JPG, WEBP)." }, { status: 400 });

  const docType = normalizeDocType(form.get("doc_type"));
  const expires = cleanDate(form.get("expires_on"));
  const path = `${contractor.company_id}/${randomUUID()}-${safeFileName(file.name)}`;
  const upload = await db.storage.from(COMPANY_DOCS_BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type || "application/octet-stream" });
  if (upload.error) return NextResponse.json({ error: `Could not store the file: ${upload.error.message}` }, { status: 500 });

  const { data, error } = await db
    .from("contractor_documents")
    .insert({
      company_id: contractor.company_id,
      doc_type: docType,
      label: String(form.get("label") || "").trim().slice(0, 120) || null,
      doc_number: String(form.get("doc_number") || "").trim().slice(0, 80) || null,
      expires_on: expires,
      storage_path: path,
      file_name: file.name.slice(0, 200),
      mime_type: file.type || null,
      size_bytes: file.size,
      uploaded_by: userId,
    })
    .select("id")
    .single();
  if (error) {
    await db.storage.from(COMPANY_DOCS_BUCKET).remove([path]);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
