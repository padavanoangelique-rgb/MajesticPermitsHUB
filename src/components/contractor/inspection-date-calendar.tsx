"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { InspectionDateOption } from "@/lib/next-inspection-day";

export function InspectionDateCalendar({
  dateOptions,
  value,
  onChange,
  disabled,
}: {
  dateOptions: InspectionDateOption[];
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const allowed = useMemo(() => new Set(dateOptions.map((o) => o.value)), [dateOptions]);
  const initial = value || dateOptions[0]?.value || format(new Date(), "yyyy-MM-dd");
  const [cursor, setCursor] = useState(() => {
    const [y, m] = initial.split("-").map(Number);
    return startOfMonth(new Date(y, (m || 1) - 1, 1));
  });

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setCursor((d) => addMonths(d, -1))}
          className="rounded-lg border border-border px-2 py-1 text-xs dark:border-border"
        >
          Prev
        </button>
        <p className="text-sm font-semibold text-primary dark:text-white">
          {format(cursor, "MMMM yyyy")}
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setCursor((d) => addMonths(d, 1))}
          className="rounded-lg border border-border px-2 py-1 text-xs dark:border-border"
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const canPick = allowed.has(key);
          const selected = value === key;
          const weekend = day.getDay() === 0 || day.getDay() === 6;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled || !canPick}
              onClick={() => onChange(key)}
              className={
                "h-9 rounded-lg text-xs font-medium " +
                (selected
                  ? "bg-primary text-white dark:bg-primary dark:text-primary-foreground "
                  : canPick
                    ? "bg-card text-foreground hover:bg-primary/10 dark:bg-background dark:text-white "
                    : "text-muted-foreground dark:text-muted-foreground ") +
                (isSameMonth(day, cursor) ? "" : "opacity-40 ") +
                (isSameDay(day, new Date()) && !selected ? "ring-1 ring-inset ring-primary/40 " : "") +
                (weekend && !canPick ? "cursor-not-allowed " : "")
              }
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Weekdays only. Earliest date follows the noon cutoff and skips weekends.
      </p>
    </div>
  );
}
