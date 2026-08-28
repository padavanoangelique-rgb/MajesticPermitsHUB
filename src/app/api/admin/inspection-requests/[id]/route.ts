import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdminEmail } from "@/lib/admin";

/** Only these fields may be written from the admin console. */
const ALLOWED_FIELDS = [
  "status",
  "handled_at",
  "scheduled_date",
  "result",
  "result_date",
  "correction_notes",
  "inspection_code",
  "inspection_type",
  "notes",
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await req.json();

    const update: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) update[key] = body[key] === "" ? null : body[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const service = createServiceClient();
    const { error } = await service
      .from("inspection_requests")
      .update(update)
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
