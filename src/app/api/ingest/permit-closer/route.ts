import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.LEAD_INGEST_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "LEAD_INGEST_SECRET is not set on the Hub" },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const property_address = String(body.address || body.property_address || "").trim();
    if (!property_address) {
      return NextResponse.json({ error: "Property address is required" }, { status: 400 });
    }

    const notesParts = [
      "Source: The Permit Closer lead generator",
      body.job_value ? `Quoted / job value: $${body.job_value}` : "",
      body.notes ? String(body.notes) : "",
    ].filter(Boolean);

    const insert = {
      property_address,
      homeowner_name: body.name || body.homeowner_name || null,
      homeowner_email: body.email || body.homeowner_email || null,
      homeowner_phone: body.phone || body.homeowner_phone || body.contact || null,
      client_type: "homeowner",
      brand: "The Permit Closer",
      stage: "Getting your project ready",
      sub_status: "Need to Submit",
      permit_number: body.permit_number || null,
      trade_type: body.permit_type || body.trade_type || "Expired permit close-out",
      jurisdiction: body.county || body.jurisdiction || null,
      next_step: "Intake sold Permit Closer lead and start close-out research",
      notes: notesParts.join("\n"),
    };

    const supabase = createServiceClient();
    const { data: job, error } = await supabase.from("jobs").insert(insert).select("id").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { error: linkError } = await supabase.from("homeowner_links").insert({ job_id: job.id });

    return NextResponse.json({
      id: job.id,
      url: `https://hub.majesticpermits.com/admin/jobs/${job.id}`,
      warning: linkError ? linkError.message : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Create failed" }, { status: 500 });
  }
}
