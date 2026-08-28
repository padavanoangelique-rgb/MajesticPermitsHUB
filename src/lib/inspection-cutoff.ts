/**
 * Inspection request scheduling rules for Majestic Permits.
 *
 * Policy: a request submitted before 12:00 PM (America/New_York) on a business
 * day may ask for the NEXT business day. After noon, the earliest date the
 * contractor can request is the business day AFTER that.
 *
 * Enforced in two places on purpose:
 *  - the client form limits the date picker (nice UX)
 *  - the API route re-checks it (authoritative — a client can be tampered with)
 */

export const CUTOFF_HOUR = 12; // noon, America/New_York
export const BUSINESS_TZ = "America/New_York";

export const CUTOFF_NOTICE =
  "Next-business-day inspection cutoff: submit your request by 12:00 PM on the prior business day. Requests received after noon are scheduled for the next available inspection date.";

/**
 * Observed non-inspection days (city offices closed). Dates are YYYY-MM-DD.
 * Add to this list each year — anything listed here is skipped the same way a
 * weekend is.
 */
export const OBSERVED_HOLIDAYS: string[] = [
  // 2026
  "2026-01-01", // New Year's Day
  "2026-01-19", // MLK Day
  "2026-02-16", // Presidents' Day
  "2026-05-25", // Memorial Day
  "2026-06-19", // Juneteenth
  "2026-07-03", // Independence Day (observed)
  "2026-09-07", // Labor Day
  "2026-11-11", // Veterans Day
  "2026-11-26", // Thanksgiving
  "2026-11-27", // Day after Thanksgiving
  "2026-12-25", // Christmas Day
  // 2027
  "2027-01-01",
  "2027-01-18",
  "2027-02-15",
  "2027-05-31",
  "2027-06-18",
  "2027-07-05",
  "2027-09-06",
  "2027-11-11",
  "2027-11-25",
  "2027-11-26",
  "2027-12-24",
];

/** Current calendar date + hour in the business timezone. */
export function businessNow(now: Date = new Date()): {
  date: string;
  hour: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")) % 24,
  };
}

/** Parse YYYY-MM-DD as a timezone-neutral UTC midnight date. */
function parseDay(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isBusinessDay(value: string): boolean {
  const day = parseDay(value).getUTCDay();
  if (day === 0 || day === 6) return false;
  return !OBSERVED_HOLIDAYS.includes(value);
}

/** Advance `count` business days from a YYYY-MM-DD date. */
export function addBusinessDays(value: string, count: number): string {
  let cursor = parseDay(value);
  let remaining = count;
  while (remaining > 0) {
    cursor = new Date(cursor.getTime() + 86_400_000);
    if (isBusinessDay(formatDay(cursor))) remaining -= 1;
  }
  return formatDay(cursor);
}

/**
 * The earliest inspection date a contractor may request right now.
 * Before noon -> next business day. After noon -> the one after that.
 */
export function earliestRequestableDate(now: Date = new Date()): string {
  const { date, hour } = businessNow(now);
  const steps = hour < CUTOFF_HOUR ? 1 : 2;
  return addBusinessDays(date, steps);
}

export function isAfterCutoff(now: Date = new Date()): boolean {
  return businessNow(now).hour >= CUTOFF_HOUR;
}

/** Friendly label like "Tuesday, September 1" for a YYYY-MM-DD date. */
export function formatBusinessDay(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(parseDay(value));
}

/** Validate a requested date against the cutoff rule. */
export function validateRequestedDate(
  value: string | null | undefined,
  now: Date = new Date()
): { ok: true; date: string | null } | { ok: false; error: string } {
  if (!value) return { ok: true, date: null };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { ok: false, error: "Preferred date must be a valid date." };
  }

  const earliest = earliestRequestableDate(now);

  if (value < earliest) {
    return {
      ok: false,
      error: isAfterCutoff(now)
        ? `Requests submitted after 12:00 PM are not eligible for next-business-day scheduling. Your earliest available date is ${formatBusinessDay(
            earliest
          )}.`
        : `The earliest date we can request is ${formatBusinessDay(earliest)}.`,
    };
  }

  if (!isBusinessDay(value)) {
    return {
      ok: false,
      error: `${formatBusinessDay(
        value
      )} is not an inspection day. Please choose a business day.`,
    };
  }

  return { ok: true, date: value };
}
