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
    <div className="rounded-3xl border border-border bg-card p-8 shadow-soft dark:border-border dark:bg-surface-dark sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">
        Stage {stageNumber} of {totalStages}
      </p>

      <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
        {stage.title}
      </h2>

      <p className="mt-5 text-lg leading-relaxed text-muted-foreground dark:text-muted-foreground">
        {stage.description}
      </p>

      <div className="mt-8 space-y-4 border-t border-border pt-6 dark:border-border">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            What happens next
          </p>
          <p className="mt-1 text-base text-foreground">
            {nextStep || stage.next}
          </p>
        </div>

        {permitEta && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Estimated ready date
            </p>
            <p className="mt-1 text-base font-medium text-primary">
              {format(new Date(permitEta), "MMMM d, yyyy")}
            </p>
          </div>
        )}
      </div>

      {customNote && (
        <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-5 dark:bg-primary/10">
          <p className="text-sm font-medium text-primary">Note from Majestic Permits</p>
          <p className="mt-2 text-base leading-relaxed text-foreground">
            {customNote}
          </p>
        </div>
      )}
    </div>
  );
}
