import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Marks a quote as paid once Stripe confirms the payment.
 * Point a Stripe webhook at /api/stripe/webhook for
 * `checkout.session.completed` and store the signing secret
 * in STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not configured" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  if (webhookSecret) {
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      return NextResponse.json(
        { error: `Signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }
  } else {
    // Not configured yet — refuse rather than trusting unsigned input
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured yet" },
      { status: 503 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const quoteId = session.metadata?.quote_id;
    const supabase = createServiceClient();

    const update = {
      status: "Accepted",
      paid_at: new Date().toISOString(),
    };

    if (quoteId) {
      await supabase.from("quotes").update(update).eq("id", quoteId);
    } else {
      await supabase
        .from("quotes")
        .update(update)
        .eq("stripe_payment_intent_id", session.id);
    }
  }

  return NextResponse.json({ received: true });
}
