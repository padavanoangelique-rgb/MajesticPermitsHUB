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
          <div className="absolute left-0 top-5 h-0.5 w-full bg-secondary dark:bg-secondary" />
          <motion.div
            className="absolute left-0 top-5 h-0.5 bg-primary"
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
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-background text-primary ring-4 ring-primary/30",
                    !isCompleted &&
                      !isCurrent &&
                      "border-border bg-card text-muted-foreground dark:border-border dark:bg-surface-dark"
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
                      ? "text-primary"
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
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-background text-primary ring-4 ring-primary/30",
                    !isCompleted &&
                      !isCurrent &&
                      "border-border text-muted-foreground"
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
                      isCompleted ? "bg-primary" : "bg-secondary"
                    )}
                  />
                )}
              </div>
              <div className={cn("pb-6", isCurrent && "pt-1")}>
                <p
                  className={cn(
                    "font-medium",
                    isCurrent
                      ? "text-lg text-primary"
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
