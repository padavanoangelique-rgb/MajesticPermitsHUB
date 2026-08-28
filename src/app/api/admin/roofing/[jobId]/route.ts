import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const NUMERIC_FIELDS = [
  "roof_area_sf",
  "mean_roof_height_ft",
  "roof_slope_rise",
  "roof_pitch_deg",
  "insured_value_usd",
];
const INT_FIELDS = ["design_wind_speed_mph", "year_permitted"];

const TEXT_FIELDS = [
  "roof_system",
  "work_type",
  "product_approval_type",
  "noa_number",
  "noa_holder",
  "noa_expires_on",
  "manufacturer",
  "product_name",
  "deck_type",
  "exposure_category",
  "risk_category",
  "tile_profile",
  "attachment_method",
  "asbestos_survey_status",
  "asbestos_note",
  "notes",
];

/** Create or update the roofing system record for a job. */
export async function PUT(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const body = await req.json();
    const patch: Record<string, any> = { job_id: params.jobId };

    for (const f of TEXT_FIELDS) {
      if (f in body) patch[f] = body[f] === "" ? null : body[f];
    }
    for (const f of NUMERIC_FIELDS) {
      if (f in body) {
        const n = Number(body[f]);
        patch[f] = body[f] === "" || body[f] === null || Number.isNaN(n) ? null : n;
      }
    }
    for (const f of INT_FIELDS) {
      if (f in body) {
        const n = parseInt(String(body[f]), 10);
        patch[f] = Number.isNaN(n) ? null : n;
      }
    }
    if ("roof_to_wall_required" in body) {
      patch.roof_to_wall_required =
        body.roof_to_wall_required === null ||
        body.roof_to_wall_required === "" ||
        body.roof_to_wall_required === "unknown"
          ? null
          : body.roof_to_wall_required === true ||
            body.roof_to_wall_required === "true";
    }
    patch.updated_at = new Date().toISOString();

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("job_roofing_systems")
      .upsert(patch, { onConflict: "job_id" })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ roofing_system: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Save failed" },
      { status: 500 }
    );
  }
}
