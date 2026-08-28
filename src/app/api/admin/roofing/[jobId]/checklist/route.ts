import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { buildChecklist, type ChecklistContext } from "@/lib/roofing/forms";

export const dynamic = "force-dynamic";

/**
 * Rebuild the required-form checklist for a job from its roofing system
 * and jurisdiction.
 *
 * Existing rows are preserved: we never clobber a status a technician has
 * already set, and we never delete an item that already has a document
 * attached. Items that the rules no longer require are marked 'waived'
 * with a reason instead of vanishing.
 */
export async function POST(
  _req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = createServiceClient();

    const { data: job } = await supabase
      .from("jobs")
      .select("id, jurisdiction")
      .eq("id", params.jobId)
      .maybeSingle();

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const { data: rs } = await supabase
      .from("job_roofing_systems")
      .select(
        "roof_system, work_type, roof_to_wall_required, insured_value_usd, year_permitted"
      )
      .eq("job_id", params.jobId)
      .maybeSingle();

    const ctx: ChecklistContext = {
      jurisdiction: job.jurisdiction ?? null,
      roofSystem: (rs?.roof_system as any) ?? null,
      workType: (rs?.work_type as any) ?? null,
      roofToWallRequired: rs?.roof_to_wall_required ?? null,
      insuredValueUsd: rs?.insured_value_usd ?? null,
      yearPermitted: rs?.year_permitted ?? null,
    };

    const desired = buildChecklist(ctx);

    const { data: existing } = await supabase
      .from("job_form_checklist")
      .select("id, template_code, status, document_id")
      .eq("job_id", params.jobId);

    const existingByCode = new Map(
      (existing || []).map((r: any) => [r.template_code, r])
    );

    // Upsert everything the rules currently want.
    const rows = desired.map((item) => {
      const prior = existingByCode.get(item.templateCode);
      return {
        job_id: params.jobId,
        template_code: item.templateCode,
        title: item.title,
        required: item.required,
        sort_order: item.sortOrder,
        // Preserve any status a human already set.
        status: prior?.status ?? (item.required ? "not_started" : "waived"),
        waived_reason: item.waivedReason ?? null,
        notes: [item.reason, item.needsConfirmation ? "Needs confirmation." : null]
          .filter(Boolean)
          .join(" ") || null,
        updated_at: new Date().toISOString(),
      };
    });

    if (rows.length > 0) {
      const { error } = await supabase
        .from("job_form_checklist")
        .upsert(rows, { onConflict: "job_id,template_code" });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Anything no longer in the ruleset: waive it rather than delete, unless
    // it is empty and untouched, in which case remove the noise.
    const desiredCodes = new Set(desired.map((d) => d.templateCode));
    const stale = (existing || []).filter(
      (r: any) => !desiredCodes.has(r.template_code)
    );
    for (const s of stale as any[]) {
      if (!s.document_id && s.status === "not_started") {
        await supabase.from("job_form_checklist").delete().eq("id", s.id);
      } else {
        await supabase
          .from("job_form_checklist")
          .update({
            required: false,
            status: s.document_id ? s.status : "waived",
            waived_reason:
              "No longer required after a roof system or jurisdiction change.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", s.id);
      }
    }

    const { data: fresh } = await supabase
      .from("job_form_checklist")
      .select("*")
      .eq("job_id", params.jobId)
      .order("sort_order", { ascending: true });

    return NextResponse.json({ checklist: fresh || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Rebuild failed" },
      { status: 500 }
    );
  }
}
