// Next available inspection day, Miami time (America/New_York).
//
// Rule:
//   - Before 12:00pm Miami time  → tomorrow
//   - At or after 12:00pm         → day after tomorrow
//   - Then skip weekends: if the resulting day lands on Sat, bump to Mon;
//     if it lands on Sun, bump to Mon.
//
// Returns the date formatted as YYYY-MM-DD (matches Postgres DATE columns
// and doesn't depend on the caller's local timezone).

const MIAMI_TZ = "America/New_York";

interface MiamiParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  weekday: number; // 0=Sun, 6=Sat
}

function partsInMiami(now: Date): MiamiParts {
  // Intl gives us the wall-clock values in the target timezone
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: MIAMI_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    weekday: weekdayMap[get("weekday")] ?? 0,
  };
}

function addDaysYMD(y: number, m: number, d: number, days: number): {
  y: number;
  m: number;
  d: number;
  weekday: number;
} {
  // Use UTC math to avoid local-timezone offsets, then read back the weekday.
  const base = Date.UTC(y, m - 1, d);
  const shifted = new Date(base + days * 86_400_000);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Given a moment in time, returns the next available inspection date
 * (YYYY-MM-DD) using the noon-cutoff + weekend-skip rule.
 */
export function nextInspectionDate(now: Date = new Date()): string {
  const miami = partsInMiami(now);
  // Before noon Miami time → offset 1 day; at/after noon → offset 2 days
  const initialOffset = miami.hour < 12 ? 1 : 2;

  let candidate = addDaysYMD(miami.year, miami.month, miami.day, initialOffset);
  // Skip Sat (6) → Mon, Sun (0) → Mon
  while (candidate.weekday === 0 || candidate.weekday === 6) {
    candidate = addDaysYMD(candidate.y, candidate.m, candidate.d, 1);
  }
  return ymd(candidate.y, candidate.m, candidate.d);
}

/**
 * Human-friendly label of the next available inspection day, e.g.
 * "Tomorrow (Mon, Sep 1)" or "Mon, Sep 1". Used on the confirm button.
 */
export function nextInspectionLabel(now: Date = new Date()): string {
  const miami = partsInMiami(now);
  const initialOffset = miami.hour < 12 ? 1 : 2;
  let candidate = addDaysYMD(miami.year, miami.month, miami.day, initialOffset);
  const usedInitial = { ...candidate };
  while (candidate.weekday === 0 || candidate.weekday === 6) {
    candidate = addDaysYMD(candidate.y, candidate.m, candidate.d, 1);
  }
  // Format as "Mon, Sep 1"
  const dateObj = new Date(
    Date.UTC(candidate.y, candidate.m - 1, candidate.d, 12)
  );
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: MIAMI_TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(dateObj);
  const tomorrowLike =
    initialOffset === 1 &&
    candidate.y === usedInitial.y &&
    candidate.m === usedInitial.m &&
    candidate.d === usedInitial.d;
  return tomorrowLike ? `Tomorrow (${label})` : label;
}

/**
 * Reason we couldn't request for tomorrow (used by the UI to explain the
 * bump). Returns null when the initial offset landed on a weekday and no
 * bump was needed.
 */
export function nextInspectionReason(
  now: Date = new Date()
): "after_noon_cutoff" | "weekend_skip" | null {
  const miami = partsInMiami(now);
  if (miami.hour >= 12) return "after_noon_cutoff";

  // Check if tomorrow would land on a weekend
  const tomorrow = addDaysYMD(miami.year, miami.month, miami.day, 1);
  if (tomorrow.weekday === 0 || tomorrow.weekday === 6) return "weekend_skip";

  return null;
}

export interface InspectionDateOption {
  value: string; // YYYY-MM-DD
  label: string; // "Tomorrow (Mon, Sep 1)" or "Tue, Sep 2"
}

/**
 * A list of selectable inspection dates for the contractor date picker.
 * The earliest option is the same noon-cutoff-adjusted day nextInspectionDate
 * returns; every option after that is the next weekday in sequence (weekends
 * skipped throughout, not just for the first one).
 */
export function upcomingInspectionDates(
  count: number,
  now: Date = new Date()
): InspectionDateOption[] {
  const miami = partsInMiami(now);
  const initialOffset = miami.hour < 12 ? 1 : 2;

  let candidate = addDaysYMD(miami.year, miami.month, miami.day, initialOffset);
  while (candidate.weekday === 0 || candidate.weekday === 6) {
    candidate = addDaysYMD(candidate.y, candidate.m, candidate.d, 1);
  }

  const options: InspectionDateOption[] = [];
  let isFirst = true;
  while (options.length < count) {
    const dateObj = new Date(Date.UTC(candidate.y, candidate.m - 1, candidate.d, 12));
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: MIAMI_TZ,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(dateObj);

    options.push({
      value: ymd(candidate.y, candidate.m, candidate.d),
      label: isFirst && initialOffset === 1 ? `Tomorrow (${formatted})` : formatted,
    });
    isFirst = false;

    do {
      candidate = addDaysYMD(candidate.y, candidate.m, candidate.d, 1);
    } while (candidate.weekday === 0 || candidate.weekday === 6);
  }

  return options;
}

/**
 * Server-side check that a contractor-submitted date is actually a legal
 * inspection date: on/after the noon-cutoff minimum, and a weekday. Used to
 * validate the client's chosen date before writing it — never trust the
 * client's date picker alone.
 */
export function isValidInspectionDate(
  dateStr: string,
  now: Date = new Date()
): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);

  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (weekday === 0 || weekday === 6) return false;

  const minDate = nextInspectionDate(now);
  return dateStr >= minDate;
}
