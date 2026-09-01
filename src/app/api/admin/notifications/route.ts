import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("id, job_id, type, message, read, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const unread = (data || []).filter((n) => !n.read).length;
  return NextResponse.json({ notifications: data || [], unread });
}

/** Body: { ids?: string[] } — marks the given ids read, or all unread if omitted. */
export async function PATCH(req: Request) {
  const supabase = createServiceClient();
  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body?.ids) ? body.ids : null;

  const query = supabase.from("admin_notifications").update({ read: true });
  const { error } = ids
    ? await query.in("id", ids)
    : await query.eq("read", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
