"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface ContractorOption {
  id: string;
  label: string;
}

export interface StageOption {
  title: string;
  short: string;
}

export function JobsFilterBar({
  contractors,
  stages,
}: {
  contractors: ContractorOption[];
  stages: StageOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openMenu, setOpenMenu] = useState<"contractor" | "stage" | null>(null);
  const contractorMenuRef = useRef<HTMLDivElement>(null);
  const stageMenuRef = useRef<HTMLDivElement>(null);

  const type = searchParams.get("type") ?? "all";
  const selectedContractorIds = (searchParams.get("contractor") ?? "")
    .split(",")
    .filter(Boolean);
  const selectedStages = (searchParams.get("stage") ?? "")
    .split(",")
    .filter(Boolean);

  function updateParams(mutate: (p: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(params.toString() ? `${pathname}?${params}` : pathname);
  }

  function setType(next: string) {
    updateParams((p) => {
      if (next === "all") p.delete("type");
      else p.set("type", next);
      if (next === "homeowner") p.delete("contractor");
    });
  }

  function toggleContractor(id: string) {
    updateParams((p) => {
      const current = new Set(selectedContractorIds);
      if (current.has(id)) current.delete(id);
      else current.add(id);
      if (current.size === 0) p.delete("contractor");
      else p.set("contractor", Array.from(current).join(","));
    });
  }

  function clearContractors() {
    updateParams((p) => p.delete("contractor"));
  }

  function toggleStage(title: string) {
    updateParams((p) => {
      const current = new Set(selectedStages);
      if (current.has(title)) current.delete(title);
      else current.add(title);
      if (current.size === 0) p.delete("stage");
      else p.set("stage", Array.from(current).join(","));
    });
  }

  function clearStages() {
    updateParams((p) => p.delete("stage"));
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        contractorMenuRef.current &&
        !contractorMenuRef.current.contains(target) &&
        stageMenuRef.current &&
        !stageMenuRef.current.contains(target)
      ) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-[#090909]">
        {[
          { value: "all", label: "All" },
          { value: "contractor", label: "Contractors" },
          { value: "homeowner", label: "Homeowners" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
              (type === opt.value
                ? "bg-[#156cdd] text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200")
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {type !== "homeowner" && contractors.length > 0 && (
        <div className="relative" ref={contractorMenuRef}>
          <button
            type="button"
            onClick={() => setOpenMenu((m) => (m === "contractor" ? null : "contractor"))}
            aria-expanded={openMenu === "contractor"}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-[#090909] dark:text-slate-300"
          >
            Contractor
            {selectedContractorIds.length > 0 && (
              <span className="rounded-full bg-[#156cdd] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {selectedContractorIds.length}
              </span>
            )}
          </button>
          {openMenu === "contractor" && (
            <div className="absolute left-0 z-10 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-[#090909]">
              <div className="max-h-64 overflow-y-auto">
                {contractors.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedContractorIds.includes(c.id)}
                      onChange={() => toggleContractor(c.id)}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
              {selectedContractorIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearContractors}
                  className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                >
                  Clear selection
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="relative" ref={stageMenuRef}>
        <button
          type="button"
          onClick={() => setOpenMenu((m) => (m === "stage" ? null : "stage"))}
          aria-expanded={openMenu === "stage"}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-[#090909] dark:text-slate-300"
        >
          Stage
          {selectedStages.length > 0 && (
            <span className="rounded-full bg-[#156cdd] px-1.5 py-0.5 text-[11px] font-semibold text-white">
              {selectedStages.length}
            </span>
          )}
        </button>
        {openMenu === "stage" && (
          <div className="absolute left-0 z-10 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-[#090909]">
            <div className="max-h-64 overflow-y-auto">
              {stages.map((s) => (
                <label
                  key={s.title}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedStages.includes(s.title)}
                    onChange={() => toggleStage(s.title)}
                  />
                  {s.short}
                </label>
              ))}
            </div>
            {selectedStages.length > 0 && (
              <button
                type="button"
                onClick={clearStages}
                className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
              >
                Clear selection
              </button>
            )}
          </div>
        )}
      </div>

      {(type !== "all" || selectedContractorIds.length > 0 || selectedStages.length > 0) && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
