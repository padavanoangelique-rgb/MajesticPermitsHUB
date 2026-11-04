import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getContractorForUser } from "@/lib/contractor";

export const dynamic = "force-dynamic";

/**
 * Contractors do not record inspection results: Majestic does, from the inspector's report (or the inspection bot),
 * and the result then shows on the contractor's schedule. This route used to let a contractor post a pass or fail;
 * it now only answers, so an old page or a script cannot.
 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const contractor = await getContractorForUser(user);
  if (!contractor) return NextResponse.json({ error: "No contractor profile" }, { status: 403 });
  return NextResponse.json(
    { error: "Majestic records inspection results. They appear on your schedule as soon as they are in." },
    { status: 403 },
  );
}
