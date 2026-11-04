import { currentVisit, isoDay, phaseOf, visitName, type InspectionRow, type Phase } from "@/lib/inspection-flow";

// What the contractor sees about a job's next inspection. A visit Majestic has put on the calendar but not confirmed
// yet reads as pending: the contractor hears about the date when it is confirmed.
export type InspectionLine = { phase: Phase; text: string; flag: string | null };

export function dayLabel(value: string | null | undefined) {
  const key = isoDay(value);
  if (!key) return "";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function inspectionLine(rows: InspectionRow[]): InspectionLine | null {
  const visit = currentVisit(rows);
  if (!visit) return null;
  const phase = phaseOf(visit);
  const name = visitName(visit);
  switch (phase) {
    case "ready":
      return { phase, text: `${name} inspection: ready to request`, flag: null };
    case "requested":
    case "tentative":
      return { phase: "requested", text: `${name} inspection requested${visit.requested_date ? ` for ${dayLabel(visit.requested_date)}` : ""}. Majestic is scheduling it`, flag: null };
    case "scheduled":
      return { phase, text: `${name} inspection ${dayLabel(visit.scheduled_date)}${visit.inspection_time ? ` at ${visit.inspection_time}` : ""}`, flag: null };
    case "needs_reinspection": {
      const fee = Number(visit.reinspection_fee);
      return {
        phase,
        text: `${name} inspection did not pass. Re-inspection needed${visit.reinspection_fee_status === "due" && fee > 0 ? ` · $${fee.toFixed(2)} fee due` : ""}`,
        flag: "Reinspection needed",
      };
    }
    default:
      return null;
  }
}

