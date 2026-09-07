import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";
import { getResend } from "@/lib/email";
import { FROM_REQUESTS, MAILBOX } from "@/lib/mailboxes";
import { sendSms } from "@/lib/sms";
import { publicTrackBrand } from "@/lib/public-brand";

export const dynamic = "force-dynamic";

const HUB = "https://hub.majesticpermits.com";

function randomToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

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

    const body = await req.json().catch(() => ({}));
    const channel = body.channel === "sms" ? "sms" : "email";
    const toEmail = String(body.email || "").trim();
    const toPhone = String(body.phone || "").trim();
    const toName = String(body.name || "").trim();

    if (channel === "email" && (!toEmail || !toEmail.includes("@"))) {
      return NextResponse.json({ error: "Enter the email to send to" }, { status: 400 });
    }
    if (channel === "sms" && toPhone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Enter the mobile number to text" }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: job } = await service
      .from("jobs")
      .select("id, property_address, brand, client_type, contractor_id")
      .eq("id", params.id)
      .maybeSingle();

    if (!job || job.contractor_id !== contractor.id) {
      return NextResponse.json({ error: "Not your job" }, { status: 403 });
    }

    let { data: link } = await service
      .from("homeowner_links")
      .select("token, enabled")
      .eq("job_id", job.id)
      .maybeSingle();

    if (!link) {
      const token = randomToken();
      const inserted = await service
        .from("homeowner_links")
        .insert({ job_id: job.id, token, enabled: true })
        .select("token, enabled")
        .single();
      if (inserted.error || !inserted.data) {
        return NextResponse.json(
          { error: inserted.error?.message || "Could not create link" },
          { status: 400 }
        );
      }
      link = inserted.data;
    }

    if (link.enabled === false) {
      await service.from("homeowner_links").update({ enabled: true }).eq("job_id", job.id);
    }

    const url = `${HUB}/track/${link.token}`;
    const brand = publicTrackBrand(job, contractor);
    const greeting = toName ? `Hi ${toName},` : "Hello,";
    const address = job.property_address || "your project";

    if (channel === "email") {
      const { error } = await getResend().emails.send({
        from: FROM_REQUESTS,
        to: [toEmail],
        cc: [MAILBOX.owner],
        replyTo: contractor.email || MAILBOX.requests,
        subject: `${brand} — permit status for ${address}`,
        html: `<p>${greeting}</p>
          <p>${brand} shared a live permit status link for <strong>${address}</strong>.</p>
          <p><a href="${url}">${url}</a></p>
          <p>No login needed. This page always shows the latest status.</p>`,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      const sms = await sendSms(
        toPhone,
        `${brand} — track ${address}: ${url}`
      );
      if (!sms.ok) {
        return NextResponse.json(
          { error: sms.error || "Text failed" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ ok: true, url, channel });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Could not send" },
      { status: 500 }
    );
  }
}
