import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const signature = typeof body.signature === "string" ? body.signature : "";
  if (!name) return NextResponse.json({ error: "Type your name" }, { status: 400 });
  if (!signature.startsWith("data:image/png") || signature.length > 180000) {
    return NextResponse.json({ error: "Sign in the box" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: row } = await service
    .from("contractor_form_sends")
    .select("id, status")
    .eq("token", params.token)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "This link is not valid" }, { status: 404 });
  if (row.status === "signed") return NextResponse.json({ ok: true });

  const { error } = await service
    .from("contractor_form_sends")
    .update({
      status: "signed",
      signed_name: name,
      signature,
      signed_at: new Date().toISOString(),
    })
    .eq("id", row.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
