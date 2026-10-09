import { PERMIT_STAGES } from "@/lib/stages";

export { stageIndexFromTitle } from "@/lib/stages";
import { stageIndexFromTitle } from "@/lib/stages";

export function JobStatusBar({ stage }: { stage: string }) {
  const index = stageIndexFromTitle(stage);
  const current = PERMIT_STAGES[index];
  if (!current) return <p className="text-sm font-semibold">{stage || "Stage not set"}</p>;
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
