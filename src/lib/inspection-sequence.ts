type Inspection = { slot: number; status: string; inspection_type?: string | null };
// Keep completed visits as history; expose just the first unfinished required visit.
export function visibleInspections<T extends Inspection>(rows: T[], allowed: boolean, closed = false): T[] {
  const sorted = [...rows].sort((a,b) => a.slot - b.slot);
  const history = sorted.filter(i => ["passed", "closed"].includes(i.status));
  if (closed || !allowed) return history;
  const next = sorted.find(i => !["not_required", "passed", "closed"].includes(i.status));
  return next ? [...history, next] : history;
}
export function inspectionName(i: { inspection_type?: string | null }) {
  return i.inspection_type || "Inspection";
}
