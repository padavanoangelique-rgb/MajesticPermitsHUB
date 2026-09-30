import { NextResponse } from "next/server";
import { z } from "zod";
import { PUBLIC_FORM_BRANDS, PUBLIC_PROJECT_TYPES, type PublicFormBrand, type PublicProjectType } from "@/lib/brands";
import { capturePublicLead } from "@/lib/public-leads";

export const dynamic = "force-dynamic";

const projectTypes = [...PUBLIC_PROJECT_TYPES] as [PublicProjectType, ...PublicProjectType[]];
const brands = [...PUBLIC_FORM_BRANDS] as [PublicFormBrand, ...PublicFormBrand[]];

const leadSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(40),
  email: z.string().trim().email().max(160),
  propertyAddress: z.string().trim().min(5).max(240),
  projectType: z.enum(projectTypes),
  brand: z.enum(brands),
  notes: z.string().trim().max(2000).optional().default(""),
  company_website: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Check the required fields and try again." },
        { status: 400 }
      );
    }

    const digits = parsed.data.phone.replace(/\D/g, "");
    if (digits.length < 10) {
      return NextResponse.json(
        { error: "Enter a phone number we can call." },
        { status: 400 }
      );
    }

    if (parsed.data.company_website.trim()) {
      return NextResponse.json({ ok: true });
    }

    const result = await capturePublicLead({
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      propertyAddress: parsed.data.propertyAddress,
      projectType: parsed.data.projectType,
      brand: parsed.data.brand,
      notes: parsed.data.notes,
    });

    return NextResponse.json({ ok: true, kind: result.kind });
  } catch (err: any) {
    console.error("public lead failed", err);
    return NextResponse.json(
      { error: "We couldn't save that. Call (561) 888-3805 or email hello@majesticpermits.com." },
      { status: 500 }
    );
  }
}
