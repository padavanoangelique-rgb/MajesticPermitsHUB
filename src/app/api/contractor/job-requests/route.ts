import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";
import { notifyAdmin } from "@/lib/admin-notify";
import { sendAdminSms } from "@/lib/sms";
import { sendAdminRequestEmail } from "@/lib/admin-email";
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

    const emailResult = await sendAdminRequestEmail({
      kind: "request",
      subject: `New job request — ${propertyAddress}`,
      heading: "New contractor job request",
      bodyHtml: `<p style="margin:0;color:#334155;font-size:15px;line-height:1.65;">
        <strong>${company}</strong> submitted ${propertyAddress}${tradeType ? ` · ${tradeType}` : ""}.
      </p>
      ${homeownerName ? `<p style="margin:12px 0 0;color:#334155;font-size:15px;">Homeowner: ${homeownerName}${homeownerPhone ? ` · ${homeownerPhone}` : ""}</p>` : ""}
      ${notes ? `<p style="margin:12px 0 0;color:#334155;font-size:15px;">${notes}</p>` : ""}
      ${files.length ? `<p style="margin:12px 0 0;color:#334155;font-size:15px;">${files.length} document${files.length === 1 ? "" : "s"} attached.</p>` : ""}`,
      actionUrl: "https://hub.majesticpermits.com/admin/job-requests",
      actionLabel: "Review request",
    }).catch((err: any) => ({ ok: false, error: err?.message || "email failed" }));

    return NextResponse.json({
      ok: true,
      id: job.id,
      files: uploaded.length,
      emailed: Boolean(emailResult?.ok),
      email_error: emailResult?.error || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Request failed" },
      { status: 500 }
    );
  }
}
