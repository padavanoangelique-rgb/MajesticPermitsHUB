import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Public quote-approval endpoint.
 * Authentication is by the quote's approval_token only.
 * Does NOT send any client-facing email.
 */
export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const rawName = typeof body?.name === "string" ? body.name.trim() : "";
    const approvedByName = rawName ? rawName.slice(0, 120) : null;

    const supabase = createServiceClient();

    const { data: quote, error: readError } = await supabase
      .from("quotes")
      .select(
        "id, job_id, status, approved_at, declined_at, expires_at, paid_at, bill_to"
      )
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
      return NextResponse.json({ ok: true, already: "approved" });
    }
    if (quote.declined_at) {
      return NextResponse.json(
        { error: "This quote was already declined." },
        { status: 409 }
      );
    }
    if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This quote has expired." },
        { status: 410 }
      );
    }

    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        status: "Accepted",
        approved_at: nowIso,
        approved_by_name: approvedByName,
      })
      .eq("id", quote.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Note: we intentionally do NOT auto-advance the job's stage on
    // approval — the admin drives the stage timeline manually so the
    // homeowner-facing narrative stays accurate.

    return NextResponse.json({ ok: true, status: "Accepted" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to approve quote" },
      { status: 500 }
    );
  }
}
