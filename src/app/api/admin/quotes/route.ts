import { NextResponse } from "next/server";
import crypto from "node:crypto";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { getResend, SITE_URL, quoteEmail } from "@/lib/email";
import { FROM_ACCOUNTING, MAILBOX } from "@/lib/mailboxes";

export const dynamic = "force-dynamic";

const BUCKET = "job-documents";

type Receipt = { filename: string; content: string; jobPath?: string };

async function parseBody(req: Request) {
  const type = req.headers.get("content-type") || "";
  if (type.includes("multipart/form-data")) {
    const form = await req.formData();
    const receipts: Receipt[] = [];
    const files = form
      .getAll("receipts")
      .filter((item): item is File => item instanceof File && item.size > 0);
    for (const file of files.slice(0, 5)) {
      const bytes = Buffer.from(await file.arrayBuffer());
      receipts.push({
        filename: file.name.replace(/[^\w.\-]+/g, "_"),
        content: bytes.toString("base64"),
      });
    }
    return {
      job_id: String(form.get("job_id") || ""),
      amount: Number(form.get("amount") || 0),
      description: String(form.get("description") || "") || null,
      bill_to: String(form.get("bill_to") || "homeowner"),
      expires_in_days: form.get("expires_in_days")
        ? Number(form.get("expires_in_days"))
        : null,
      send_email: String(form.get("send_email") || "true") !== "false",
      receipts,
    };
  }
  const body = await req.json().catch(() => ({}));
  return { ...body, receipts: [] as Receipt[] };
}

export async function POST(req: Request) {
  try {
    const {
      job_id,
      amount,
      description,
      bill_to = "homeowner",
      expires_in_days = null,
      send_email = true,
      receipts = [],
    } = await parseBody(req);

    if (!job_id || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "job_id and a positive amount are required" },
        { status: 400 }
      );
    }

    if (bill_to !== "homeowner" && bill_to !== "contractor") {
      return NextResponse.json(
        { error: "bill_to must be 'homeowner' or 'contractor'" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: job } = await supabase
      .from("jobs")
      .select(
        "id, brand, property_address, homeowner_email, homeowner_name, contractor_id"
      )
      .eq("id", job_id)
      .maybeSingle();

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (bill_to === "contractor" && !job.contractor_id) {
      return NextResponse.json(
        { error: "Assign a contractor to this job before billing them" },
        { status: 400 }
      );
    }

    const approvalToken = crypto.randomBytes(24).toString("hex");
    const expiresAt =
      expires_in_days && Number(expires_in_days) > 0
        ? new Date(
            Date.now() + Number(expires_in_days) * 24 * 60 * 60 * 1000
          ).toISOString()
        : null;

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        job_id,
        amount: Number(amount),
        description: description || null,
        status: "Sent",
        bill_to,
        approval_token: approvalToken,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (quoteError) {
      return NextResponse.json({ error: quoteError.message }, { status: 400 });
    }

    const storedReceipts: string[] = [];
    for (const receipt of receipts as Receipt[]) {
      const storagePath = `${job.id}/receipts/${Date.now()}_${receipt.filename}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, Buffer.from(receipt.content, "base64"), {
          contentType: "application/octet-stream",
          upsert: false,
        });
      if (!upErr) {
        await supabase.from("job_documents").insert({
          job_id: job.id,
          category: "closeout",
          label: `Permit receipt — ${receipt.filename}`,
          storage_path: storagePath,
          file_name: receipt.filename,
          visible_to_contractor: true,
          visible_to_homeowner: true,
        });
        storedReceipts.push(receipt.filename);
      }
    }

    const approvalUrl = `https://hub.majesticpermits.com/quote/${approvalToken}`;

    let payUrl: string | null = null;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (bill_to === "homeowner" && stripeKey) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `https://hub.majesticpermits.com/quote/${approvalToken}?paid=1`,
        cancel_url: `https://hub.majesticpermits.com/quote/${approvalToken}?paid=0`,
        customer_email: job.homeowner_email || undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: Math.round(Number(amount) * 100),
              product_data: {
                name: `Permit services — ${job.property_address}`,
                description: description || undefined,
              },
            },
          },
        ],
        metadata: {
          quote_id: quote.id,
          job_id: job.id,
          property_address: job.property_address,
        },
      });
      payUrl = session.url || null;
      await supabase
        .from("quotes")
        .update({ stripe_payment_intent_id: session.id })
        .eq("id", quote.id);
    }

    let emailed = false;
    let emailError: string | null = null;

    if (send_email) {
      const recipients = new Set<string>();
      if (bill_to === "homeowner" && job.homeowner_email) {
        recipients.add(job.homeowner_email);
      }
      if (job.contractor_id) {
        const { data: contractor } = await supabase
          .from("contractors")
          .select("email")
          .eq("id", job.contractor_id)
          .maybeSingle();
        if (contractor?.email) recipients.add(contractor.email);
      }

      const linkForEmail = payUrl || approvalUrl;
      if (recipients.size > 0 && process.env.RESEND_API_KEY && linkForEmail) {
        const receiptNote =
          storedReceipts.length > 0
            ? `<p style="margin:16px 0 0;font-size:14px;color:#334155;">Permit receipts attached: ${storedReceipts.join(", ")}</p>`
            : "";
        const { subject, html } = quoteEmail({
          brand: job.brand || "Majestic Permits",
          propertyAddress: job.property_address,
          amount: Number(amount),
          description: description
            ? `${description}${storedReceipts.length ? " (receipts attached)" : ""}`
            : storedReceipts.length
              ? "Permit services — receipts attached"
              : null,
          payUrl: linkForEmail,
        });

        const { error: sendError } = await getResend().emails.send({
          from: FROM_ACCOUNTING,
          to: Array.from(recipients),
          bcc: [MAILBOX.accounting, MAILBOX.owner],
          replyTo: MAILBOX.accounting,
          subject,
          html: html.replace(
            "</td>",
            `${receiptNote}</td>`
          ),
          attachments: (receipts as Receipt[]).map((r) => ({
            filename: r.filename,
            content: r.content,
          })),
        });

        if (sendError) emailError = sendError.message;
        else emailed = true;
      } else if (recipients.size === 0) {
        emailError =
          bill_to === "contractor"
            ? "Assigned contractor has no email on file"
            : "No homeowner email on the job";
      } else {
        emailError = "RESEND_API_KEY is not configured";
      }
    }

    return NextResponse.json({
      id: quote.id,
      approval_url: approvalUrl,
      pay_url: payUrl,
      emailed,
      email_error: emailError,
      receipts: storedReceipts,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create quote" },
      { status: 500 }
    );
  }
}
