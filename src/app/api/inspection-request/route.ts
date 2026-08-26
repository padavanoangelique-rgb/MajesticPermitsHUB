import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { job_id, token, inspection_type, notes, requested_by } = body;

    if (!job_id || !token) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the token belongs to this job
    const { data: link } = await supabase
      .from("homeowner_links")
      .select("job_id")
      .eq("token", token)
      .eq("job_id", job_id)
      .maybeSingle();

    if (!link) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    const { error } = await supabase.from("inspection_requests").insert({
      job_id,
      requested_by: requested_by || "homeowner",
      inspection_type: inspection_type || "Rough-in",
      notes: notes || null,
      status: "Pending",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
