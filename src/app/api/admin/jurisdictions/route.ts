import { NextResponse } from "next/server";
import { JURISDICTIONS } from "@/lib/jurisdiction-directory";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ jurisdictions: JURISDICTIONS });
}
