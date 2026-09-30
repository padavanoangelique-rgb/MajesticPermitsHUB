import { PERMIT_STAGES } from "@/lib/stages";

export function stageIndexFromTitle(stage: string) {
  const text = (stage || "").toLowerCase();
  if (text.includes("ready") || text.includes("getting")) return 0;
  if (text.includes("submit")) return 1;
  if (text.includes("review")) return 2;
  if (text.includes("correct")) return 3;
  if (text.includes("approv")) return 4;
  if (text.includes("inspect")) return 5;
  if (text.includes("final")) return 6;
  if (text.includes("close") || text.includes("complete") || text.includes("done")) return 7;
  return 0;
}

export function JobStatusBar({ stage }: { stage: string }) {
  const index = stageIndexFromTitle(stage);
  const current = PERMIT_STAGES[index] ?? PERMIT_STAGES[0];
  const width = Math.max(8, Math.round(((index + 1) / PERMIT_STAGES.length) * 100));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-foreground">{current.short}</span>
        <span className="shrink-0 text-muted-foreground">
          {index + 1} of {PERMIT_STAGES.length}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
