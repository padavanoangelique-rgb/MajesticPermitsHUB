import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Public quote-decline endpoint.
 * Authentication is by the quote's approval_token only.
 * Does NOT send any client-facing email.
 */
export async function POST(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createServiceClient();

    const { data: quote, error: readError } = await supabase
      .from("quotes")
      .select("id, approved_at, declined_at, paid_at, expires_at")
      .eq("approval_token", params.token)
      .maybeSingle();

    if (readError) {
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }
    if (!quote) {
      return NextResponse.json(
        { error: "This approval link is invalid." },
        { status: 404 }
      );
    }
    if (quote.paid_at) {
      return NextResponse.json(
        { error: "This quote has already been paid." },
        { status: 409 }
      );
    }
    if (quote.approved_at) {
      return NextResponse.json(
        { error: "This quote was already approved and cannot be declined." },
        { status: 409 }
      );
    }
    if (quote.declined_at) {
      return NextResponse.json({ ok: true, already: "declined" });
    }

    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        status: "Declined",
        declined_at: new Date().toISOString(),
      })
      .eq("id", quote.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, status: "Declined" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to decline quote" },
      { status: 500 }
    );
  }
}
