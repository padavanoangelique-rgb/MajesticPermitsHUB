export function isFinalInspection(row: {
  slot?: number | null;
  inspection_type?: string | null;
}) {
  const type = (row.inspection_type || "").toLowerCase();
  if (type.includes("final")) return true;
  return Number(row.slot) === 3;
}
