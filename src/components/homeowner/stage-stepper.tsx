"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stage {
  id: number;
  title: string;
  short: string;
}

interface StageStepperProps {
  stages: readonly Stage[];
  currentIndex: number;
}

export function StageStepper({ stages, currentIndex }: StageStepperProps) {
  return (
    <div className="w-full">
      {/* Desktop horizontal */}
      <div className="hidden sm:block">
        <div className="relative flex justify-between">
          {/* Progress line */}
          <div className="absolute left-0 top-5 h-0.5 w-full bg-slate-200 dark:bg-slate-700" />
          <motion.div
            className="absolute left-0 top-5 h-0.5 bg-navy dark:bg-gold"
            initial={{ width: "0%" }}
            animate={{
              width: `${(currentIndex / (stages.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />

          {stages.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={stage.id}
                className="relative z-10 flex flex-col items-center"
                style={{ width: `${100 / stages.length}%` }}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                    isCompleted &&
                      "border-navy bg-navy text-white dark:border-gold dark:bg-gold dark:text-navy",
                    isCurrent &&
                      "border-gold bg-white text-navy ring-4 ring-gold/30 dark:bg-navy dark:text-gold",
                    !isCompleted &&
                      !isCurrent &&
                      "border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-surface-dark"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  ) : (
                    stage.id
                  )}
                </div>
                <p
                  className={cn(
                    "mt-3 max-w-[90px] text-center text-xs font-medium leading-tight",
                    isCurrent
                      ? "text-navy dark:text-gold"
                      : "text-muted-foreground"
                  )}
                >
                  {stage.short}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile vertical */}
      <div className="sm:hidden space-y-0">
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={stage.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                    isCompleted &&
                      "border-navy bg-navy text-white dark:border-gold dark:bg-gold dark:text-navy",
                    isCurrent &&
                      "border-gold bg-white text-navy ring-4 ring-gold/30",
                    !isCompleted &&
                      !isCurrent &&
                      "border-slate-300 text-slate-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    stage.id
                  )}
                </div>
                {idx < stages.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 min-h-[28px]",
                      isCompleted ? "bg-navy dark:bg-gold" : "bg-slate-200"
                    )}
                  />
                )}
              </div>
              <div className={cn("pb-6", isCurrent && "pt-1")}>
                <p
                  className={cn(
                    "font-medium",
                    isCurrent
                      ? "text-lg text-navy dark:text-gold"
                      : "text-sm text-muted-foreground"
                  )}
                >
                  {stage.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
