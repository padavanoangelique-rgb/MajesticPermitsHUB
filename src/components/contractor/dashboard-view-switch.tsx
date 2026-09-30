"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Rows3 } from "lucide-react";

/**
 * Toggle between list view (default, jobs grouped by status) and pipeline
 * (kanban) view on the contractor dashboard. Persists selection via
 * ?view=<mode> so a link back from a job detail page returns to whichever
 * mode was in use.
 */
export function DashboardViewSwitch({
  view,
}: {
  view: "list" | "pipeline";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(next: "list" | "pipeline") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "list") params.delete("view");
    else params.set("view", next);
    router.push(params.toString() ? `${pathname}?${params}` : pathname);
  }

  const options: Array<{
    value: "list" | "pipeline";
    label: string;
    Icon: typeof LayoutGrid;
  }> = [
    { value: "list", label: "List view", Icon: Rows3 },
    { value: "pipeline", label: "Pipeline", Icon: LayoutGrid },
  ];

  return (
    <div className="inline-flex rounded-xl border border-border bg-card p-1 dark:border-border dark:bg-card">
      {options.map((opt) => {
        const active = view === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setView(opt.value)}
            className={
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
              (active
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground")
            }
          >
            <opt.Icon className="h-4 w-4" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
