import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getResend } from "@/lib/email";
import { FROM_REQUESTS, MAILBOX } from "@/lib/mailboxes";
import { findJurisdiction } from "@/lib/jurisdiction-directory";

export const dynamic = "force-dynamic";

const BUCKET = "job-documents";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const overrideEmail = String(body.email || "").trim();
    const supabase = createServiceClient();

    const { data: job, error } = await supabase
      .from("jobs")
      .select("id, property_address, jurisdiction, permit_number, noc_status, notes")
      .eq("id", params.id)
      .maybeSingle();
    if (error || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const directory = findJurisdiction(job.jurisdiction);
    const to = overrideEmail || directory?.email || "";
    if (!to || !to.includes("@")) {
      return NextResponse.json(
        { error: "Save a building department email for this jurisdiction first." },
        { status: 400 }
      );
    }

    const { data: docs } = await supabase
      .from("job_documents")
      .select("id, file_name, label, storage_path, mime_type, category")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false });

    const nocDoc = (docs || []).find((d) => {
      const blob = `${d.file_name || ""} ${d.label || ""} ${d.category || ""}`.toLowerCase();
      return blob.includes("noc") || blob.includes("notice of commencement");
    });

    if (!nocDoc) {
      return NextResponse.json(
        { error: "Upload the recorded NOC on this job first (filename or label should include NOC)." },
        { status: 400 }
      );
    }

    const { data: file, error: downErr } = await supabase.storage
      .from(BUCKET)
      .download(nocDoc.storage_path);
    if (downErr || !file) {
      return NextResponse.json(
        { error: downErr?.message || "Could not read the NOC file" },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const subject = `NOC — ${job.property_address}${job.permit_number ? ` — ${job.permit_number}` : ""}`;
    const { error: sendError } = await getResend().emails.send({
      from: FROM_REQUESTS,
      to: [to],
      cc: [MAILBOX.owner],
      replyTo: MAILBOX.requests,
      subject,
      html: `<p>Please find the recorded Notice of Commencement for <strong>${job.property_address}</strong>${job.permit_number ? ` (permit ${job.permit_number})` : ""}.</p>
        <p>Submitted by Majestic Permits.<br/>${MAILBOX.requests}</p>`,
      attachments: [
        {
          filename: nocDoc.file_name || "NOC.pdf",
          content: bytes,
        },
      ],
    });

    if (sendError) {
      return NextResponse.json({ error: sendError.message }, { status: 400 });
    }

    await supabase
      .from("jobs")
      .update({ noc_status: "Submitted" })
      .eq("id", job.id);

    return NextResponse.json({ ok: true, to, file: nocDoc.file_name });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Send failed" },
      { status: 500 }
    );
  }
}
