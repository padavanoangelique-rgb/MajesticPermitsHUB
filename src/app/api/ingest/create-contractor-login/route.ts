import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.PERMITAIO_HUB_SECRET;
  if (!secret || req.headers.get("x-hub-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const company = String(body.company || "A Plus").trim();
  const name = String(body.name || email).trim();
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const found = existingUsers?.users?.find((u) => u.email?.toLowerCase() === email);
  let userId = found?.id;

  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || "Could not create user" }, { status: 400 });
    }
    userId = data.user.id;
  }

  const { data: primary } = await supabase
    .from("contractors")
    .select("id, company_name")
    .or(`company_name.ilike.%${company}%,name.ilike.%${company}%`)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: already } = await supabase
    .from("contractors")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (!already) {
    const { error: insertError } = await supabase.from("contractors").insert({
      name,
      email,
      company_name: primary?.company_name || company,
      auth_user_id: userId,
    });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    email,
    user_id: userId,
    linked_to: primary?.company_name || company,
  });
}
