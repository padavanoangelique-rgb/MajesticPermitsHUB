import { NextResponse } from "next/server";
import { buildAdminReport } from "@/lib/reports";

export const dynamic = "force-dynamic";

/**
 * On-demand admin report download.
 * Admin auth is enforced by middleware — this is behind /api/admin/*.
 */
export async function GET() {
  try {
    const { pdf } = await buildAdminReport();
    const filename = `majestic-admin-report-${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to build report" },
      { status: 500 }
    );
  }
}
