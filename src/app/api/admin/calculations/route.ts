import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  calculateRas127Method1,
  STANDARD_REF,
  type Ras127Inputs,
} from "@/lib/roofing/ras127";

export const dynamic = "force-dynamic";

/**
 * Run and save a RAS 127-20 Method 1 worksheet.
 *
 * The calculation is re-run on the server from the submitted inputs, so what
 * gets stored is always the server's own arithmetic - a client cannot post a
 * passing result that the engine would not produce.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const jobId = body.job_id as string | undefined;
    if (!jobId) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }

    const num = (v: any) => {
      if (v === "" || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const inputs: Ras127Inputs = {
      roofForm: body.roof_form || null,
      exposureCategory: body.exposure_category || null,
      slopeRise: num(body.slope_rise),
      meanRoofHeightFt: num(body.mean_roof_height_ft),
      riskCategory: body.risk_category || null,
      hasOverhang:
        body.has_overhang === true || body.has_overhang === "true"
          ? true
          : body.has_overhang === false || body.has_overhang === "false"
            ? false
            : null,
      designWindSpeedMph: num(body.design_wind_speed_mph),
      lambda: num(body.lambda),
      mg: num(body.mg),
      mf: num(body.mf),
      sealedBy: body.sealed_by || null,
    };

    // Optional PE-sealed zone pressures, used instead of the tables.
    if (Array.isArray(body.sealed_pressures)) {
      const sealed = body.sealed_pressures
        .map((p: any) => ({
          zones: Array.isArray(p.zones)
            ? p.zones.map(String)
            : String(p.zones || "").split(/[\s,]+/).filter(Boolean),
          pasd: num(p.pasd) ?? NaN,
        }))
        .filter((p: any) => Number.isFinite(p.pasd) && p.zones.length > 0);
      if (sealed.length > 0) inputs.sealedPressures = sealed;
    }

    const result = calculateRas127Method1(inputs);

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("job_roof_calculations")
      .insert({
        job_id: jobId,
        method: "ras127_m1",
        label: body.label || null,
        inputs: {
          ...inputs,
          noa_number: body.noa_number || null,
          noa_expires_on: body.noa_expires_on || null,
          tile_profile: body.tile_profile || null,
          application: body.application || null,
        },
        results: result as any,
        // Method 1 has no velocity pressure; the column stays null on purpose.
        qh_psf: null,
        // Store the governing (worst) zone as the headline numbers.
        mf_ft_lbf: null,
        mg_ft_lbf: inputs.mg,
        mr_required_ft_lbf: result.zones.length
          ? Math.max(...result.zones.map((z) => z.mr))
          : null,
        mr_noa_ft_lbf: inputs.mf,
        passes: result.passes,
        requires_engineering: result.requiresEngineering,
        engineering_reason: result.engineeringReason,
        standard_ref: STANDARD_REF,
        reviewed_by_pe: inputs.sealedBy || null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ id: data.id, result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Calculation failed" },
      { status: 500 }
    );
  }
}
