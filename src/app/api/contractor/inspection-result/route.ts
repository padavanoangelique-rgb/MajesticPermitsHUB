import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";
import { notifyAdmin } from "@/lib/admin-notify";
import { sendAdminRequestEmail } from "@/lib/admin-email";
import { closeJobIfFinalPassed, isFinalInspection } from "@/lib/close-on-final";

export const dynamic = "force-dynamic";

const RESULTS = new Set(["passed", "failed", "partial_pass"]);

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const contractor = await getContractorForUser(user);
    if (!contractor) {
      return NextResponse.json({ error: "No contractor profile" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const inspectionId = String(body.inspection_id || "").trim();
    const status = String(body.result || "").trim();
    const notes = String(body.notes || "").trim();
    const treatAsFinal = Boolean(body.final) || false;

    if (!inspectionId) {
      return NextResponse.json({ error: "Missing inspection" }, { status: 400 });
    }
    if (!RESULTS.has(status)) {
      return NextResponse.json({ error: "Pick passed, failed, or partial pass" }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: inspection } = await service
      .from("job_inspections")
      .select("id, job_id, slot, inspection_type, status, scheduled_date")
      .eq("id", inspectionId)
      .maybeSingle();

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
    }

    const { data: job } = await service
      .from("jobs")
      .select("id, property_address, contractor_id, stage")
      .eq("id", inspection.job_id)
      .maybeSingle();

    if (!job || job.contractor_id !== contractor.id) {
      return NextResponse.json({ error: "Not your job" }, { status: 403 });
    }
    if (job.stage === "Permit closed — all done") {
      return NextResponse.json({ error: "This job is already closed" }, { status: 409 });
    }

    const allowed = new Set([
      "scheduled",
      "reinspection_scheduled",
      "requested",
      "reinspection_requested",
    ]);
    if (!allowed.has(inspection.status)) {
      return NextResponse.json(
        { error: "A result is already on file for this inspection" },
        { status: 409 }
      );
    }

    const resultNote = notes
      ? `Contractor result: ${notes}`
      : "Contractor reported result before admin.";

    const { error: updErr } = await service
      .from("job_inspections")
      .update({
        status,
        result_date: new Date().toISOString().slice(0, 10),
        correction_notes: resultNote,
      })
      .eq("id", inspection.id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    const label = inspection.inspection_type || `Inspection ${inspection.slot}`;
    const closed = await closeJobIfFinalPassed({
      jobId: job.id,
      inspection: { ...inspection, status },
      treatAsFinal: treatAsFinal || isFinalInspection(inspection),
    });

    const message = closed.closed
      ? `${contractor.company_name || contractor.name} reported FINAL ${label} PASSED at ${job.property_address}. Job closed.`
      : `${contractor.company_name || contractor.name} reported ${label} ${status.replace("_", " ")} at ${job.property_address}.`;

    await notifyAdmin("inspection_result", message, job.id);
    await sendAdminRequestEmail({
      kind: "inspection",
      subject: `Inspection result — ${job.property_address}`,
      heading: "Contractor posted an inspection result",
      bodyHtml: `<p style="margin:0;color:#334155;font-size:15px;line-height:1.65;">${message}</p>${notes ? `<p style="margin:12px 0 0;color:#334155;">${notes}</p>` : ""}`,
      actionUrl: `https://hub.majesticpermits.com/admin/jobs/${job.id}`,
      actionLabel: "Open job",
    }).catch(() => null);

    return NextResponse.json({ ok: true, status, closed: closed.closed });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Could not save result" },
      { status: 500 }
    );
  }
}
