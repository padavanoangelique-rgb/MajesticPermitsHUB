import { PERMIT_STAGES, stageIndexFromTitle, stageTone, type StageTone } from "@/lib/stages";

export { stageIndexFromTitle } from "@/lib/stages";

// One colour family per kind of stage, so a column of jobs reads at a glance: violet = permit, rose = corrections,
// amber = install, sky = inspection, emerald = done. Tailwind needs the full class names written out.
const TONES: Record<StageTone, { fill: string; pill: string; label: string }> = {
  permit: { fill: "bg-violet-400", pill: "bg-violet-500/15 text-violet-200 ring-violet-400/30", label: "Permit" },
  corrections: { fill: "bg-rose-400", pill: "bg-rose-500/15 text-rose-200 ring-rose-400/30", label: "Corrections" },
  install: { fill: "bg-amber-400", pill: "bg-amber-500/15 text-amber-200 ring-amber-400/30", label: "Install" },
  inspection: { fill: "bg-sky-400", pill: "bg-sky-500/15 text-sky-200 ring-sky-400/30", label: "Inspection" },
  done: { fill: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30", label: "Done" },
  unknown: { fill: "bg-slate-400", pill: "bg-slate-500/15 text-slate-200 ring-slate-400/30", label: "Status" },
};

export function JobStatusBar({ stage, flag }: { stage: string; flag?: string | null }) {
  const index = stageIndexFromTitle(stage);
  const current = PERMIT_STAGES[index];
  if (!current) return <p className="text-sm font-semibold">{stage || "Stage not set"}</p>;
  const tone = TONES[stageTone(stage)];

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${tone.pill}`}>{tone.label}</span>
          <span className="font-semibold text-foreground">{current.short}</span>
          {flag && <span className="rounded-full bg-rose-500/20 px-2 py-0.5 font-semibold text-rose-200 ring-1 ring-inset ring-rose-400/40">{flag}</span>}
        </span>
        <span className="shrink-0 text-muted-foreground">
          {index + 1} of {PERMIT_STAGES.length}
        </span>
      </div>
      <div className="flex gap-0.5" role="img" aria-label={`${current.title}, step ${index + 1} of ${PERMIT_STAGES.length}`}>
        {PERMIT_STAGES.map((s, i) => (
          <span
            key={s.key}
            className={"h-2.5 flex-1 rounded-sm " + (i <= index ? tone.fill : "bg-white/10") + (i === index ? " ring-1 ring-white/70" : "")}
          />
        ))}
      </div>
    </div>
  );
}
