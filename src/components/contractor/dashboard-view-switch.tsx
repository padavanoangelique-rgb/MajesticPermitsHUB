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
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-[#090909]">
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
                ? "bg-[#156cdd] text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200")
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
