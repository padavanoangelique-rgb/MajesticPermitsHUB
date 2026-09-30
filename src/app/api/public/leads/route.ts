import { NextResponse } from "next/server";
import { z } from "zod";
import { capturePublicLead } from "@/lib/public-leads";

export const dynamic = "force-dynamic";

const ALLOWED_ORIGINS = new Set([
  "https://majesticpermits.com",
  "https://www.majesticpermits.com",
  "https://thepermitcloser.com",
  "https://www.thepermitcloser.com",
  "https://hub.majesticpermits.com",
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "https://www.majesticpermits.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

const leadSchema = z.object({
  intent: z.enum(["more-info", "permit-report", "contact"]),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  company: z.string().trim().max(160).optional().default(""),
  propertyAddress: z.string().trim().max(240).optional().default(""),
  message: z.string().trim().max(500).optional().default(""),
  company_website: z.string().optional().default(""),
});

export function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const headers = corsHeaders(req);
  try {
    const body = await req.json();
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Check your name and email and try again." },
        { status: 400, headers }
      );
    }

    if (parsed.data.company_website.trim()) {
      return NextResponse.json({ ok: true }, { headers });
    }

    if (parsed.data.intent === "permit-report" && parsed.data.propertyAddress.trim().length < 5) {
      return NextResponse.json(
        { error: "Add the property address from the letter." },
        { status: 400, headers }
      );
    }

    const result = await capturePublicLead(parsed.data);
    return NextResponse.json({ ok: true, kind: result.kind }, { headers });
  } catch (err: any) {
    console.error("public lead failed", err);
    return NextResponse.json(
      { error: "We couldn't save that. Email hello@majesticpermits.com." },
      { status: 500, headers }
    );
  }
}