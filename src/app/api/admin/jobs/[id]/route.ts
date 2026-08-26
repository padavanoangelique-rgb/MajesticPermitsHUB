import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/** Only these columns may be written from the admin UI. */
const ALLOWED_FIELDS = [
  "property_address",
  "homeowner_name",
  "homeowner_email",
  "homeowner_phone",
  "client_type",
  "brand",
  "contractor_id",
  "stage",
  "sub_status",
  "permit_number",
  "permit_eta",
  "submitted_date",
  "next_step",
  "notes",
  "trade_type",
  "jurisdiction",
  "building_dept_url",
  "noc_status",
] as const;

function sanitize(body: Record<string, any>) {
  const patch: Record<string, any> = {};
  for (const key of ALLOWED_FIELDS) {
    if (!(key in body)) continue;
    let value = body[key];
    // Empty strings should clear the column, not fail a uuid/date cast
    if (value === "") value = null;
    patch[key] = value;
  }
  return patch;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const patch = sanitize(body);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No updatable fields provided" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("jobs")
      .update(patch)
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Update failed" },
      { status: 500 }
    );
  }
}
