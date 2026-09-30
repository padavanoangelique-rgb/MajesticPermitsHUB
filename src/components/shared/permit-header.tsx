import { format } from "date-fns";

interface PermitHeaderProps {
  permitNumber?: string | null;
  submittedDate?: string | null;
  permitEta?: string | null;
  /** "compact" = single row for cards; "full" = 3-cell block for pages */
  variant?: "compact" | "full";
}

/**
 * Renders the three at-a-glance permit fields the same way everywhere:
 *   Permit #, Submitted, and Permit ETA.
 *
 * Empty values render clear "Pending / Not submitted / To be determined"
 * placeholders rather than blanks.
 */
export function PermitHeader({
  permitNumber,
  submittedDate,
  permitEta,
  variant = "full",
}: PermitHeaderProps) {
  const permitDisplay = permitNumber && permitNumber.trim().length > 0
    ? `#${permitNumber}`
    : "Pending assignment";

  const submittedDisplay = submittedDate
    ? format(new Date(submittedDate), "MMM d, yyyy")
    : "Not yet submitted";

  const etaDisplay = permitEta
    ? format(new Date(permitEta), "MMM d, yyyy")
    : "To be determined";

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground dark:text-foreground">
            Permit
          </span>{" "}
          {permitDisplay}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <span className="font-medium text-foreground dark:text-foreground">
            Submitted
          </span>{" "}
          {submittedDisplay}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <span className="font-medium text-foreground dark:text-foreground">
            ETA
          </span>{" "}
          {etaDisplay}
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3 dark:border-border dark:bg-card">
      <Cell label="Permit #" value={permitDisplay} />
      <Cell label="Submitted" value={submittedDisplay} />
      <Cell label="Permit ETA" value={etaDisplay} highlight />
    </div>
  );
}

function Cell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={
          "mt-1 text-sm font-semibold " +
          (highlight
            ? "text-primary dark:text-primary"
            : "text-primary dark:text-white")
        }
      >
        {value}
      </p>
    </div>
  );
}
