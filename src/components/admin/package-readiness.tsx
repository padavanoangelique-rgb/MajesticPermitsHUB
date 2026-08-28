export interface Readiness {
  has_cost_estimate: boolean;
  has_product_approval: boolean;
  has_calculations: boolean;
  outstanding_forms: number;
  asbestos_survey_status: string;
}

function Row({
  label,
  ok,
  detail,
  blocking,
}: {
  label: string;
  ok: boolean;
  detail?: string;
  blocking: boolean;
}) {
  return (
    <li className="flex items-start gap-3 py-2">
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          ok
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            : blocking
              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
        }`}
      >
        {ok ? "✓" : blocking ? "!" : "?"}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[#0B1F3F] dark:text-white">
          {label}
        </span>
        {detail && (
          <span className="block text-xs text-slate-500">{detail}</span>
        )}
      </span>
    </li>
  );
}

export function PackageReadiness({
  readiness,
  calculationCount,
}: {
  readiness: Readiness | null;
  calculationCount: number;
}) {
  if (!readiness) {
    return (
      <p className="text-sm text-slate-500">
        Readiness data is unavailable for this job.
      </p>
    );
  }

  const asbestosResolved =
    readiness.asbestos_survey_status === "on_file" ||
    readiness.asbestos_survey_status === "not_applicable";

  // Only these gate "internally complete". Asbestos is a reminder by design.
  const blockers: string[] = [];
  if (!readiness.has_cost_estimate) blockers.push("cost estimate");
  if (readiness.outstanding_forms > 0) blockers.push("required forms");

  const complete = blockers.length === 0;

  return (
    <div>
      <div
        className={`rounded-xl px-4 py-3 text-sm font-semibold ${
          complete
            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        }`}
      >
        {complete
          ? "Ready to mark internally complete."
          : `Not ready — waiting on ${blockers.join(" and ")}.`}
      </div>

      <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">
        <Row
          label="Cost estimate on file"
          ok={readiness.has_cost_estimate}
          blocking
          detail={
            readiness.has_cost_estimate
              ? undefined
              : "Upload a document in the Cost estimate category. Required before the package is internally complete."
          }
        />
        <Row
          label="Required forms accounted for"
          ok={readiness.outstanding_forms === 0}
          blocking
          detail={
            readiness.outstanding_forms === 0
              ? undefined
              : `${readiness.outstanding_forms} item${
                  readiness.outstanding_forms === 1 ? "" : "s"
                } still outstanding on the checklist.`
          }
        />
        <Row
          label="Product approval / NOA pages attached"
          ok={readiness.has_product_approval}
          blocking={false}
          detail={
            readiness.has_product_approval
              ? undefined
              : "HVHZ attachment 2 — front page, system description, limitations, and detail drawings."
          }
        />
        <Row
          label="Uplift calculations run"
          ok={readiness.has_calculations}
          blocking={false}
          detail={
            readiness.has_calculations
              ? `${calculationCount} worksheet${calculationCount === 1 ? "" : "s"} saved.`
              : "RAS 127 / RAS 128 or Chapter 16 calculations, where the roof system requires them."
          }
        />
        <Row
          label="Asbestos survey confirmed"
          ok={asbestosResolved}
          blocking={false}
          detail={
            asbestosResolved
              ? undefined
              : "Reminder only — this never blocks a submittal."
          }
        />
      </ul>
    </div>
  );
}
