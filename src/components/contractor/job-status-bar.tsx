import { PERMIT_STAGES, stageKeyFromTitle } from "@/lib/stages";
import { PERMIT_BAR_KEYS, WORK_STATUSES, effectiveWorkStatus, getWorkStatus, permitApproved, permitBarIndex, workStatusIndex, type WorkTone } from "@/lib/work-status";

export { stageIndexFromTitle } from "@/lib/stages";

// Two bars. The permit bar is the permit's own status and Majestic's alone; once the permit is approved it carries a
// green "Permit approved" tag. The inspection bar is where the work is, from install to a closed permit.
// Tailwind needs the full class names written out.
const WORK_TONES: Record<WorkTone, { fill: string; pill: string }> = {
  install: { fill: "bg-amber-400", pill: "bg-amber-500/15 text-amber-200 ring-amber-400/30" },
  inspection: { fill: "bg-sky-400", pill: "bg-sky-500/15 text-sky-200 ring-sky-400/30" },
  failed: { fill: "bg-rose-400", pill: "bg-rose-500/15 text-rose-200 ring-rose-400/30" },
  done: { fill: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30" },
};

const PERMIT_SHORT = Object.fromEntries(PERMIT_STAGES.map((stage) => [stage.key, stage.short])) as Record<string, string>;

export function JobStatusBar({ stage, workStatus, flag, compact = false }: { stage: string; workStatus?: string | null; flag?: string | null; compact?: boolean }) {
  const stageKey = stageKeyFromTitle(stage);
  if (!stageKey) return <p className="text-sm font-semibold">{stage || "Status not set"}</p>;

  const approved = permitApproved(stageKey);
  const permitIndex = permitBarIndex(stageKey);
  const corrections = stageKey === "corrections";
  const permitFill = approved ? "bg-emerald-400" : corrections ? "bg-rose-400" : "bg-violet-400";

  const currentKey = effectiveWorkStatus(stageKey, workStatus);
  const current = getWorkStatus(currentKey);
  const workIndex = workStatusIndex(currentKey);
  const tone = WORK_TONES[current?.tone ?? "install"];
  const seg = compact ? "h-1.5" : "h-2.5";

  return (
    <div className={compact ? "grid gap-2" : "grid gap-3"}>
      <div>
        <div className={"flex flex-wrap items-center gap-1.5 " + (compact ? "mb-1 text-[11px]" : "mb-1.5 text-xs")}>
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">Permit</span>
          <span className="font-semibold text-foreground">{approved ? "Approved" : PERMIT_SHORT[stageKey]}</span>
          {approved && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-400/40">Permit approved</span>
          )}
        </div>
        <div className="flex gap-0.5" role="img" aria-label={approved ? "Permit approved" : `Permit: ${PERMIT_SHORT[stageKey]}`}>
          {PERMIT_BAR_KEYS.map((key, i) => (
            <span key={key} title={PERMIT_SHORT[key]} className={seg + " flex-1 rounded-sm " + (i <= permitIndex ? permitFill : "bg-white/10") + (i === permitIndex && !approved ? " ring-1 ring-white/70" : "")} />
          ))}
        </div>
      </div>

      <div>
        <div className={"flex flex-wrap items-center justify-between gap-2 " + (compact ? "mb-1 text-[11px]" : "mb-1.5 text-xs")}>
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">Inspections</span>
            {current ? (
              <>
                <span className={`rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${tone.pill}`}>{current.label}</span>
                {flag && <span className="rounded-full bg-rose-500/20 px-2 py-0.5 font-semibold text-rose-200 ring-1 ring-inset ring-rose-400/40">{flag}</span>}
              </>
            ) : (
              <span className="text-muted-foreground">Starts once the permit is approved</span>
            )}
          </span>
          {current && (
            <span className="shrink-0 text-muted-foreground">
              {workIndex + 1} of {WORK_STATUSES.length}
            </span>
          )}
        </div>
        <div className="flex gap-0.5" role="img" aria-label={current ? `${current.label}, step ${workIndex + 1} of ${WORK_STATUSES.length}` : "Inspections not started"}>
          {WORK_STATUSES.map((status, i) => (
            <span key={status.key} title={status.label} className={seg + " flex-1 rounded-sm " + (current && i <= workIndex ? tone.fill : "bg-white/10") + (i === workIndex ? " ring-1 ring-white/70" : "")} />
          ))}
        </div>
      </div>
    </div>
  );
}
