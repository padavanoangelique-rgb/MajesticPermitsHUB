import { format } from "date-fns";

interface Stage {
  title: string;
  description: string;
  next: string;
}

interface CurrentStageCardProps {
  stage: Stage;
  stageNumber: number;
  totalStages: number;
  customNote?: string | null;
  nextStep?: string | null;
  permitEta?: string | null;
}

export function CurrentStageCard({
  stage,
  stageNumber,
  totalStages,
  customNote,
  nextStep,
  permitEta,
}: CurrentStageCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-surface-dark sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-wider text-gold">
        Stage {stageNumber} of {totalStages}
      </p>

      <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-navy dark:text-white sm:text-4xl">
        {stage.title}
      </h2>

      <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
        {stage.description}
      </p>

      <div className="mt-8 space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            What happens next
          </p>
          <p className="mt-1 text-base text-navy dark:text-white">
            {nextStep || stage.next}
          </p>
        </div>

        {permitEta && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Estimated ready date
            </p>
            <p className="mt-1 text-base font-medium text-gold">
              {format(new Date(permitEta), "MMMM d, yyyy")}
            </p>
          </div>
        )}
      </div>

      {customNote && (
        <div className="mt-8 rounded-2xl border border-gold/30 bg-gold/5 p-5 dark:bg-gold/10">
          <p className="text-sm font-medium text-gold">Note from Majestic Permits</p>
          <p className="mt-2 text-base leading-relaxed text-navy dark:text-white">
            {customNote}
          </p>
        </div>
      )}
    </div>
  );
}
