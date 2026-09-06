import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";
import { notifyAdmin } from "@/lib/admin-notify";
import { sendAdminSms } from "@/lib/sms";
import { ADMIN_EMAILS } from "@/lib/admin";
import { FROM_EMAIL, getResend } from "@/lib/email";
import { PENDING_REQUEST_SUB } from "@/lib/job-request";

export const dynamic = "force-dynamic";

const BUCKET = "job-documents";
const MAX_FILES = 5;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_EXT = /\.(pdf|png|jpe?g|heic|webp|doc|docx|xls|xlsx)$/i;

export async function GET() {
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
  const { data, error } = await service
    .from("jobs")
    .select("id, property_address, trade_type, sub_status, created_at")
    .eq("contractor_id", contractor.id)
    .eq("sub_status", PENDING_REQUEST_SUB)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({
    requests: (data || []).map((row) => ({
      ...row,
      status: "pending",
    })),
  });
}

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

    const form = await req.formData();
    const propertyAddress = String(form.get("property_address") || "").trim();
    const homeownerName = String(form.get("homeowner_name") || "").trim();
    const homeownerEmail = String(form.get("homeowner_email") || "").trim();
    const homeownerPhone = String(form.get("homeowner_phone") || "").trim();
    const tradeType = String(form.get("trade_type") || "").trim();
    const jurisdiction = String(form.get("jurisdiction") || "").trim();
    const notes = String(form.get("notes") || "").trim();

    if (!propertyAddress) {
      return NextResponse.json({ error: "Property address is required" }, { status: 400 });
    }

    const files = form
      .getAll("files")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: "Up to 5 documents only" }, { status: 400 });
    }
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
    }

    const service = createServiceClient();
    const { data: job, error: insertError } = await service
      .from("jobs")
      .insert({
        client_type: "contractor",
        brand: "Majestic Permits",
        contractor_id: contractor.id,
        property_address: propertyAddress,
        homeowner_name: homeownerName || null,
        homeowner_email: homeownerEmail || null,
        homeowner_phone: homeownerPhone || null,
        trade_type: tradeType || null,
        jurisdiction: jurisdiction || null,
        notes: notes || null,
        stage: "Getting your project ready",
        sub_status: PENDING_REQUEST_SUB,
        next_step: "Contractor submitted — waiting for Majestic to approve",
      })
      .select("id")
      .single();

    if (insertError || !job) {
      return NextResponse.json(
        { error: insertError?.message || "Could not save request" },
        { status: 400 }
      );
    }

    await service.from("homeowner_links").insert({ job_id: job.id });

    const uploaded: string[] = [];
    for (const file of files) {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const storagePath = `${job.id}/intake/${Date.now()}_${safeName}`;
      const bytes = await file.arrayBuffer();
      const { error: upErr } = await service.storage
        .from(BUCKET)
        .upload(storagePath, Buffer.from(bytes), {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 400 });
      }
      uploaded.push(storagePath);
      await service.from("job_documents").insert({
        job_id: job.id,
        category: "intake",
        label: file.name,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
        visible_to_contractor: true,
        visible_to_homeowner: false,
      });
    }

    const company = contractor.company_name || contractor.name || "Contractor";
    const notice = `${company} requested a new job at ${propertyAddress}${tradeType ? ` (${tradeType})` : ""}.`;
    await notifyAdmin("job_request", notice, job.id);
    await sendAdminSms(`New job request — ${notice}`);

    let emailed = false;
    let emailError: string | null = null;
    try {
      const recipients = Array.from(
        new Set(
          [...ADMIN_EMAILS, "angelique@majesticpermits.com"].map((e) => e.toLowerCase())
        )
      );
      const { error: sendError } = await getResend().emails.send({
        from: `Majestic Permits <${FROM_EMAIL}>`,
        to: recipients,
        subject: `New job request — ${propertyAddress}`,
        html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;padding:24px;">
          <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dedede;border-radius:16px;padding:28px;">
            <p style="margin:0 0 6px;color:#156cdd;font-weight:700;">Majestic Permits</p>
            <h1 style="margin:0 0 12px;color:#156cdd;font-size:22px;">New contractor job request</h1>
            <p style="margin:0;color:#334155;font-size:15px;line-height:1.65;">
              <strong>${company}</strong> submitted ${propertyAddress}${tradeType ? ` · ${tradeType}` : ""}.
            </p>
            ${homeownerName ? `<p style="margin:12px 0 0;color:#334155;font-size:15px;">Homeowner: ${homeownerName}${homeownerPhone ? ` · ${homeownerPhone}` : ""}</p>` : ""}
            ${notes ? `<p style="margin:12px 0 0;color:#334155;font-size:15px;">${notes}</p>` : ""}
            ${files.length ? `<p style="margin:12px 0 0;color:#334155;font-size:15px;">${files.length} document${files.length === 1 ? "" : "s"} attached.</p>` : ""}
            <p style="margin:24px 0 0;">
              <a href="https://hub.majesticpermits.com/admin/job-requests" style="display:inline-block;background:#156cdd;color:#fff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:10px;">Review request</a>
            </p>
          </div>
        </body></html>`,
      });
      if (sendError) {
        emailError = sendError.message;
        console.error("job request email failed", sendError);
      } else {
        emailed = true;
      }
    } catch (err: any) {
      emailError = err?.message || "email send failed";
      console.error("job request email failed", err);
    }

    return NextResponse.json({
      ok: true,
      id: job.id,
      files: uploaded.length,
      emailed,
      email_error: emailError,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Request failed" },
      { status: 500 }
    );
  }
}
