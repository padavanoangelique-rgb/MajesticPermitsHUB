import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

const BUCKET = "job-documents";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const action = body?.action === "decline" ? "decline" : "approve";
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    const supabase = createServiceClient();
    const { data: requestRow, error } = await supabase
      .from("job_requests")
      .select(
        "id, contractor_id, property_address, homeowner_name, homeowner_email, homeowner_phone, trade_type, jurisdiction, notes, status"
      )
      .eq("id", params.id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!requestRow) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (requestRow.status !== "pending") {
      return NextResponse.json({ error: "Already handled" }, { status: 409 });
    }

    if (action === "decline") {
      const { error: updErr } = await supabase
        .from("job_requests")
        .update({
          status: "declined",
          decline_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestRow.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
      return NextResponse.json({ ok: true, status: "declined" });
    }

    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .insert({
        client_type: "contractor",
        brand: "Majestic Permits",
        contractor_id: requestRow.contractor_id,
        property_address: requestRow.property_address,
        homeowner_name: requestRow.homeowner_name,
        homeowner_email: requestRow.homeowner_email,
        homeowner_phone: requestRow.homeowner_phone,
        trade_type: requestRow.trade_type,
        jurisdiction: requestRow.jurisdiction,
        notes: requestRow.notes,
        stage: "Getting your project ready",
        sub_status: "Need to Submit",
        next_step: "Intake review of contractor documents",
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      return NextResponse.json(
        { error: jobErr?.message || "Could not create job" },
        { status: 400 }
      );
    }

    await supabase.from("homeowner_links").insert({ job_id: job.id });

    const { data: files } = await supabase
      .from("job_request_files")
      .select("storage_path, file_name, mime_type, size_bytes")
      .eq("request_id", requestRow.id);

    for (const file of files || []) {
      await supabase.from("job_documents").insert({
        job_id: job.id,
        category: "intake",
        label: file.file_name,
        storage_path: file.storage_path,
        file_name: file.file_name,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
        visible_to_contractor: true,
        visible_to_homeowner: false,
      });
    }

    const { error: updErr } = await supabase
      .from("job_requests")
      .update({
        status: "approved",
        approved_job_id: job.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestRow.id);

    if (updErr) {
      return NextResponse.json({ error: updErr.message, job_id: job.id }, { status: 400 });
    }

    return NextResponse.json({ ok: true, status: "approved", job_id: job.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Update failed" }, { status: 500 });
  }
}
