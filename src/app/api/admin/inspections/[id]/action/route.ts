import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { confirmVisit, InspectionError, recordVisitResult, scheduleVisit, unscheduleVisit, updateDayOf } from "@/lib/inspection-actions";

export const dynamic = "force-dynamic";

/**
 * One endpoint for what Majestic does to an inspection from the calendar: schedule, unschedule, confirm (tells the
 * contractor), day_of (time, inspector, notes) and result (passed / failed / partial_pass). /api/admin/* is already
 * limited to the admin sign-in by the middleware.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const by = user?.email || "admin";
    const db = createServiceClient();
    const id = params.id;

    switch (String(body.action || "")) {
      case "schedule":
        return NextResponse.json({ ok: true, ...(await scheduleVisit(db, { inspectionId: id, date: body.date, time: body.time, by })) });
      case "unschedule":
        return NextResponse.json({ ok: true, ...(await unscheduleVisit(db, id, by)) });
      case "confirm":
        return NextResponse.json({ ok: true, ...(await confirmVisit(db, id, by)) });
      case "day_of":
        return NextResponse.json({
          ok: true,
          ...(await updateDayOf(db, {
            inspectionId: id,
            time: body.time,
            inspector_name: body.inspector_name,
            inspector_number: body.inspector_number,
            notes: body.notes,
            notify: body.notify !== false,
            by,
          })),
        });
      case "result":
        return NextResponse.json({
          ok: true,
          ...(await recordVisitResult(db, {
            inspectionId: id,
            result: body.result,
            date: body.date,
            notes: body.notes,
            fee: body.fee,
            inspector_name: body.inspector_name,
            notify: body.notify !== false,
            by,
          })),
        });
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (err: any) {
    if (err instanceof InspectionError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err?.message || "Could not update the inspection." }, { status: 500 });
  }
}
