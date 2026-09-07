import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";
import { notifyAdmin } from "@/lib/admin-notify";
import { sendAdminRequestEmail } from "@/lib/admin-email";

export const dynamic = "force-dynamic";

const BUCKET = "job-documents";
const MAX_FILES = 5;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_EXT = /\.(pdf|png|jpe?g|heic|webp|doc|docx|xls|xlsx)$/i;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const service = createServiceClient();
    const { data: job } = await service
      .from("jobs")
      .select("id, property_address, contractor_id")
      .eq("id", params.id)
      .maybeSingle();

    if (!job || job.contractor_id !== contractor.id) {
      return NextResponse.json({ error: "Not your job" }, { status: 403 });
    }

    const form = await req.formData();
    const category = String(form.get("category") || "intake").trim() || "intake";
    const files = form
      .getAll("files")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (!files.length) {
      return NextResponse.json({ error: "Choose at least one file" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: "Up to 5 files at a time" }, { status: 400 });
    }

    const uploaded: string[] = [];
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: `${file.name} is over 8MB` }, { status: 400 });
      }
      if (!ALLOWED_EXT.test(file.name)) {
        return NextResponse.json(
          { error: `${file.name} is not an allowed file type` },
          { status: 400 }
        );
      }
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const storagePath = `${job.id}/contractor/${Date.now()}_${safeName}`;
      const bytes = await file.arrayBuffer();
      const { error: upErr } = await service.storage
        .from(BUCKET)
        .upload(storagePath, Buffer.from(bytes), {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

      const { error: insErr } = await service.from("job_documents").insert({
        job_id: job.id,
        category,
        label: file.name,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
        visible_to_contractor: true,
        visible_to_homeowner: false,
      });
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });
      uploaded.push(file.name);
    }

    const company = contractor.company_name || contractor.name || "Contractor";
    const message = `${company} uploaded ${uploaded.length} file${uploaded.length === 1 ? "" : "s"} to ${job.property_address}: ${uploaded.join(", ")}`;
    await notifyAdmin("job_upload", message, job.id);
    await sendAdminRequestEmail({
      kind: "request",
      subject: `New files — ${job.property_address}`,
      heading: "Contractor uploaded documents",
      bodyHtml: `<p style="margin:0;color:#334155;font-size:15px;line-height:1.65;">${message}</p>`,
      actionUrl: `https://hub.majesticpermits.com/admin/jobs/${job.id}`,
      actionLabel: "Open job",
    }).catch(() => null);

    return NextResponse.json({ ok: true, files: uploaded.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
