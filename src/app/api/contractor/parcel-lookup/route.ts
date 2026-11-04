import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getContractorForUser } from "@/lib/contractor";
import { JURISDICTIONS } from "@/lib/jurisdiction-directory";
import { isParcelCounty, searchParcels, withJurisdiction } from "@/lib/parcel";

export const dynamic = "force-dynamic";

/** The built-in departments plus the ones added on the admin jurisdictions page. */
async function departmentNames() {
  const names = JURISDICTIONS.map((entry) => entry.name);
  try {
    const { data } = await createServiceClient().storage.from("job-documents").download("app-settings/jurisdiction-contacts.json");
    const saved = data ? JSON.parse(await data.text()) : [];
    if (Array.isArray(saved)) for (const row of saved) if (row?.name && !names.some((name) => name.toLowerCase() === String(row.name).toLowerCase())) names.push(String(row.name));
  } catch {
    // The built-in list still works.
  }
  return names;
}

/** Search the county property appraiser by address, owner or folio. Each match comes back with its jurisdiction. */
export async function GET(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const contractor = await getContractorForUser(user);
  if (!contractor) return NextResponse.json({ error: "No contractor profile" }, { status: 403 });

  const url = new URL(req.url);
  const county = url.searchParams.get("county");
  if (!isParcelCounty(county)) return NextResponse.json({ error: "Pick Palm Beach, Broward or Miami-Dade", results: [] }, { status: 400 });

  try {
    const hits = await searchParcels(county, url.searchParams.get("q") || "", { base: process.env.MAJESTIC_API_BASE });
    return NextResponse.json({ results: withJurisdiction(hits, await departmentNames()) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Lookup failed", results: [] }, { status: 502 });
  }
}
