import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdminEmail } from "@/lib/admin";
import { textClientStatusChange } from "@/lib/job-status-sms";

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
  "submitted_date",
  "next_step",
  "notes",
  "homeowner_note",
  "internal_notes",
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
    if (value === "") value = null;
    patch[key] = value;
  }
  return patch;
}

function isDeskSession() {
  return cookies().get("mp_desk")?.value === "1";
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
    const { data: before } = await supabase
      .from("jobs")
      .select("stage, sub_status")
      .eq("id", params.id)
      .maybeSingle();

    const { error } = await supabase
      .from("jobs")
      .update(patch)
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const stageChanged =
      typeof patch.stage === "string" && patch.stage !== before?.stage;
    const subChanged =
      "sub_status" in patch && patch.sub_status !== before?.sub_status;
    if (stageChanged || subChanged) {
      await textClientStatusChange({
        jobId: params.id,
        stage: patch.stage ?? before?.stage,
        subStatus: patch.sub_status ?? before?.sub_status,
      }).catch((err) => console.error("status sms failed", err));
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const desk = isDeskSession();
    if (!desk) {
      const auth = createClient();
      const {
        data: { user },
      } = await auth.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Not signed in" }, { status: 401 });
      }
      if (!isAdminEmail(user.email)) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
    }

    const supabase = createServiceClient();

    const { data: job, error: lookupError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", params.id)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 400 });
    }
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const { data: docs } = await supabase
      .from("job_documents")
      .select("storage_path")
      .eq("job_id", params.id);

    const paths = (docs || [])
      .map((d: any) => d.storage_path)
      .filter(Boolean);

    if (paths.length > 0) {
      await supabase.storage.from("job-documents").remove(paths);
    }

    await supabase.from("mph_stage_history").delete().eq("job_id", params.id);
    await supabase.from("mph_email_queue").delete().eq("job_id", params.id);

    const { error } = await supabase.from("jobs").delete().eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Delete failed" },
      { status: 500 }
    );
  }
}
