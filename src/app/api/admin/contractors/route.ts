import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/** Admin-only (enforced in middleware): list contractors for assignment dropdowns. */
export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("contractors")
    .select("id, name, company_name, email")
    .order("company_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contractors: data || [] });
}
