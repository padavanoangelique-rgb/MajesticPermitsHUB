import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

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
  "next_step",
  "notes",
] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const insert: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (!(key in body)) continue;
      let value = body[key];
      if (value === "") value = null;
      insert[key] = value;
    }

    if (!insert.property_address) {
      return NextResponse.json(
        { error: "Property address is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: job, error } = await supabase
      .from("jobs")
      .insert(insert)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Every job gets a shareable homeowner tracking link
    const { error: linkError } = await supabase
      .from("homeowner_links")
      .insert({ job_id: job.id });

    if (linkError) {
      return NextResponse.json(
        {
          id: job.id,
          warning: `Job created but tracking link failed: ${linkError.message}`,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ id: job.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Create failed" },
      { status: 500 }
    );
  }
}
