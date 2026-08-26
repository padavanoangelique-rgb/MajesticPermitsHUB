import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { getResend, FROM_EMAIL, SITE_URL, quoteEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Creates a quote for a job, generates a Stripe Checkout link for it and
 * emails that link to the homeowner (and contractor, if the job has one).
 *
 * Protected by middleware — admins only.
 */
export async function POST(req: Request) {
  try {
    const { job_id, amount, description, send_email = true } = await req.json();

    if (!job_id || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "job_id and a positive amount are required" },
        { status: 400 }
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY is not configured in Vercel" },
        { status: 500 }
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

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        job_id,
        amount: Number(amount),
        description: description || null,
        status: "Sent",
      })
      .select("id")
      .single();

    if (quoteError) {
      return NextResponse.json({ error: quoteError.message }, { status: 400 });
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

    await supabase
      .from("quotes")
      .update({ stripe_payment_intent_id: session.id })
      .eq("id", quote.id);

    let emailed = false;
    let emailError: string | null = null;

    if (send_email && session.url) {
      const recipients = new Set<string>();
      if (job.homeowner_email) recipients.add(job.homeowner_email);

      if (job.contractor_id) {
        const { data: contractor } = await supabase
          .from("contractors")
          .select("email")
          .eq("id", job.contractor_id)
          .maybeSingle();
        if (contractor?.email) recipients.add(contractor.email);
      }

      if (recipients.size > 0 && process.env.RESEND_API_KEY) {
        const { subject, html } = quoteEmail({
          brand: job.brand || "Majestic Permits",
          propertyAddress: job.property_address,
          amount: Number(amount),
          description,
          payUrl: session.url,
        });

        const { error: sendError } = await getResend().emails.send({
          from: `Majestic Permits <${FROM_EMAIL}>`,
          to: Array.from(recipients),
          subject,
          html,
        });

        if (sendError) emailError = sendError.message;
        else emailed = true;
      } else {
        emailError = "No recipient email on the job, or RESEND_API_KEY missing";
      }
    }

    return NextResponse.json({
      id: quote.id,
      pay_url: session.url,
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
