import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { JURISDICTIONS, type JurisdictionContact } from "@/lib/jurisdiction-directory";

export const dynamic = "force-dynamic";

const BUCKET = "job-documents";
const PATH = "app-settings/jurisdiction-contacts.json";

async function readSaved(): Promise<JurisdictionContact[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(PATH);
  if (error || !data) return [];
  try {
    const parsed = JSON.parse(await data.text());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function merge(saved: JurisdictionContact[]) {
  const map = new Map<string, JurisdictionContact>();
  for (const row of JURISDICTIONS) map.set(row.name.toLowerCase(), { ...row });
  for (const row of saved) {
    if (!row?.name) continue;
    const key = row.name.toLowerCase();
    map.set(key, { ...(map.get(key) || { name: row.name, email: "" }), ...row });
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function GET() {
  const saved = await readSaved();
  return NextResponse.json({ jurisdictions: merge(saved) });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const portal = String(body.portal || "").trim();
    if (!name || !email || !email.includes("@")) {
      return NextResponse.json(
        { error: "City name and a valid email are required" },
        { status: 400 }
      );
    }

    const saved = await readSaved();
    const next = saved.filter((row) => row.name.toLowerCase() !== name.toLowerCase());
    next.push({
      name,
      email,
      portal: portal || undefined,
      nocByEmail: true,
    });

    const supabase = createServiceClient();
    const { error } = await supabase.storage.from(BUCKET).upload(
      PATH,
      JSON.stringify(next, null, 2),
      { contentType: "application/json", upsert: true }
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, jurisdictions: merge(next) });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Could not save contact" },
      { status: 500 }
    );
  }
}
