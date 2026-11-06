import { NextResponse } from "next/server";
import { buildAdminReport, isReportView } from "@/lib/reports";

export const dynamic = "force-dynamic";

/**
 * On-demand admin report download. `?view=` picks the jobs: all (default), need_submit, in_review, approved,
 * inspections or noc. Admin auth is enforced by middleware, since this is behind /api/admin/*.
 */
export async function GET(req: Request) {
  try {
    const requested = new URL(req.url).searchParams.get("view");
    const view = isReportView(requested) ? requested : "all";
    const { pdf } = await buildAdminReport(view);
    const filename = `majestic-${view.replace(/_/g, "-")}-jobs-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
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
