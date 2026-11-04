import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser, type ContractorRecord } from "@/lib/contractor";

export const COMPANY_DOCS_BUCKET = "contractor-docs";

/** The signed-in contractor and their company, or the error response to return. */
export async function requireCompany(): Promise<
  { ok: true; contractor: ContractorRecord & { company_id: string }; db: ReturnType<typeof createServiceClient>; userId: string } | { ok: false; response: NextResponse }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  const contractor = await getContractorForUser(user);
  if (!contractor) return { ok: false, response: NextResponse.json({ error: "No contractor profile" }, { status: 403 }) };
  if (!contractor.company_id) return { ok: false, response: NextResponse.json({ error: "Your company is not set up yet. Contact Majestic Permits." }, { status: 409 }) };
  return { ok: true, contractor: contractor as ContractorRecord & { company_id: string }, db: createServiceClient(), userId: user.id };
}
