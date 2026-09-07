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
    const documentId = String(body.documentId || "").trim();
    const contractorEmail = String(body.contractorEmail || "").trim();
    const supabase = createServiceClient();

    const { data: job, error } = await supabase
      .from("jobs")
      .select("id, property_address, jurisdiction, permit_number, contractor_id")
      .eq("id", params.id)
      .maybeSingle();
    if (error || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const directory = findJurisdiction(job.jurisdiction);
    const to = overrideEmail || directory?.email || "";
    if (!to || !to.includes("@")) {
      return NextResponse.json(
        { error: "Pick a building department contact first." },
        { status: 400 }
      );
    }

    const { data: docs } = await supabase
      .from("job_documents")
      .select("id, file_name, label, storage_path, mime_type, category")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false });

    const nocDoc =
      (docs || []).find((d) => d.id === documentId) ||
      (docs || []).find((d) => {
        const blob = `${d.file_name || ""} ${d.label || ""} ${d.category || ""}`.toLowerCase();
        return blob.includes("noc") || blob.includes("notice of commencement");
      });

    if (!nocDoc) {
      return NextResponse.json(
        { error: "Choose or upload the NOC on this job first." },
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

    let ccContractor = contractorEmail;
    if (!ccContractor && job.contractor_id) {
      const { data: contractor } = await supabase
        .from("contractors")
        .select("email")
        .eq("id", job.contractor_id)
        .maybeSingle();
      ccContractor = contractor?.email || "";
    }

    const cc: string[] = [MAILBOX.owner];
    if (
      ccContractor &&
      ccContractor.includes("@") &&
      ccContractor.toLowerCase() !== to.toLowerCase()
    ) {
      cc.push(ccContractor);
    }

    const permit = job.permit_number || "(permit number pending)";
    const subject = `NOC for permit Number ${permit} — ${job.property_address}`;
    const { error: sendError } = await getResend().emails.send({
      from: FROM_REQUESTS,
      to: [to],
      cc,
      replyTo: MAILBOX.requests,
      subject,
      html: `<p>Please see attached NOC for permit Number <strong>${permit}</strong>.</p>
        <p>${job.property_address}</p>
        <p>Submitted by Majestic Permits<br/>${MAILBOX.requests}</p>`,
      text: `Please see attached NOC for permit Number ${permit}.\n\n${job.property_address}\n\nSubmitted by Majestic Permits\n${MAILBOX.requests}`,
      attachments: [
        {
          filename: nocDoc.file_name || "NOC.pdf",
          content: Buffer.from(await file.arrayBuffer()),
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

    return NextResponse.json({
      ok: true,
      to,
      cc,
      file: nocDoc.file_name,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Send failed" },
      { status: 500 }
    );
  }
}
