import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getContractorForUser } from "@/lib/contractor";

export const dynamic = "force-dynamic";

/**
 * Contractors do not set a job's status: Majestic does, from the permit portal and the inspection results. This route
 * used to let a contractor move their own job to any stage; it now only answers, so an old page or a script cannot.
 */
export async function PATCH() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const contractor = await getContractorForUser(user);
  if (!contractor) return NextResponse.json({ error: "No contractor profile" }, { status: 403 });
  return NextResponse.json(
    { error: "Majestic updates the status of your jobs. Use \"What's up with this one?\" if something looks wrong." },
    { status: 403 },
  );
}
