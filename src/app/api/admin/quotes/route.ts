import { NextResponse } from "next/server";
import crypto from "node:crypto";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { getResend, FROM_EMAIL, SITE_URL, quoteEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Create a quote for a job.
 *
 * - bill_to = "homeowner" (default): generates a Stripe Checkout link
 *   and (optionally) emails the homeowner + assigned contractor.
 * - bill_to = "contractor": no Stripe Checkout session is generated.
 *   The contractor receives an approval link that returns them to the
 *   contractor portal where they can accept or decline.
 *
 * Every quote also gets its own approval_token so the recipient can
 * approve or decline it from a signed link, without needing to log in.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      job_id,
      amount,
      description,
      bill_to = "homeowner",
      expires_in_days = null,
      send_email = true,
    } = body || {};

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

    const approvalUrl = `${SITE_URL}/quote/${approvalToken}`;

    // Stripe Checkout is only wired up for homeowner-billed quotes today.
    let payUrl: string | null = null;
    if (bill_to === "homeowner") {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        return NextResponse.json(
          { error: "STRIPE_SECRET_KEY is not configured in Vercel" },
          { status: 500 }
        );
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${SITE_URL}/?paid=1`,
        cancel_url: `${SITE_URL}/?paid=0`,
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
      // Homeowner quotes go to the homeowner (+ CC contractor if any).
      // Contractor quotes go to the contractor only.
      const recipients = new Set<string>();

      if (bill_to === "homeowner") {
        if (job.homeowner_email) recipients.add(job.homeowner_email);
      }

      if (job.contractor_id) {
        const { data: contractor } = await supabase
          .from("contractors")
          .select("email")
          .eq("id", job.contractor_id)
          .maybeSingle();
        if (contractor?.email && bill_to === "contractor") {
          recipients.add(contractor.email);
        } else if (contractor?.email && bill_to === "homeowner") {
          recipients.add(contractor.email);
        }
      }

      const linkForEmail = payUrl || approvalUrl;

      if (recipients.size > 0 && process.env.RESEND_API_KEY && linkForEmail) {
        const { subject, html } = quoteEmail({
          brand: job.brand || "Majestic Permits",
          propertyAddress: job.property_address,
          amount: Number(amount),
          description,
          payUrl: linkForEmail,
        });

        const { error: sendError } = await getResend().emails.send({
          from: `Majestic Permits <${FROM_EMAIL}>`,
          to: Array.from(recipients),
          subject,
          html,
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
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create quote" },
      { status: 500 }
    );
  }
}
