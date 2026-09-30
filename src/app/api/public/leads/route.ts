import { NextResponse } from "next/server";
import { z } from "zod";
import { capturePublicLead } from "@/lib/public-leads";

export const dynamic = "force-dynamic";

const leadSchema = z.object({
  intent: z.enum(["more-info", "permit-report", "contact"]),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  company: z.string().trim().max(160).optional().default(""),
  propertyAddress: z.string().trim().max(240).optional().default(""),
  message: z.string().trim().max(500).optional().default(""),
  company_website: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Check your name and email and try again." },
        { status: 400 }
      );
    }

    if (parsed.data.company_website.trim()) {
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.intent === "permit-report" && parsed.data.propertyAddress.trim().length < 5) {
      return NextResponse.json(
        { error: "Add the property address from the letter." },
        { status: 400 }
      );
    }

    const result = await capturePublicLead(parsed.data);
    return NextResponse.json({ ok: true, kind: result.kind });
  } catch (err: any) {
    console.error("public lead failed", err);
    return NextResponse.json(
      { error: "We couldn't save that. Email hello@majesticpermits.com." },
      { status: 500 }
    );
  }
}
