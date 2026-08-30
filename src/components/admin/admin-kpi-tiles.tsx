import Link from "next/link";
import { AlertCircle, CheckCircle2, ClipboardCheck, Search } from "lucide-react";

/**
 * Four at-a-glance counts for the admin home page.
 *
 * Definitions (locked in with product):
 *   In review        = jobs.stage === "Under review"
 *   Approved         = jobs.stage === "Approved — ready to build"
 *   Needs inspection = at least one job_inspections row with status "not_scheduled"
 *   Needs follow-up  = updated_at is 7+ days old
 *
 * Each tile is a link to the admin table pre-filtered where possible, so
 * clicking a number drills into the underlying rows. "Needs inspection" and
 * "Needs follow-up" don't have a table filter yet so they scroll to the top
 * of the list.
 */
export function AdminKpiTiles({
  inReview,
  approved,
  needsInspection,
  needsFollowUp,
}: {
  inReview: number;
  approved: number;
  needsInspection: number;
  needsFollowUp: number;
}) {
  const tiles = [
    {
      label: "In review",
      value: inReview,
      href: "/admin?stage=Under+review",
      Icon: Search,
      accent: "text-blue-600 dark:text-blue-400",
      ring: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: "Approved",
      value: approved,
      href:
        "/admin?stage=" +
        encodeURIComponent("Approved — ready to build"),
      Icon: CheckCircle2,
      accent: "text-emerald-600 dark:text-emerald-400",
      ring: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Needs inspection",
      value: needsInspection,
      href: "/admin",
      Icon: ClipboardCheck,
      accent: "text-[#C9A24B]",
      ring: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      label: "Needs follow-up",
      value: needsFollowUp,
      href: "/admin",
      Icon: AlertCircle,
      accent: "text-red-600 dark:text-red-400",
      ring: "bg-red-50 dark:bg-red-950/40",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map(({ label, value, href, Icon, accent, ring }) => (
        <Link
          key={label}
          href={href}
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-[#111827]"
        >
          <div className={"flex h-11 w-11 items-center justify-center rounded-xl " + ring}>
            <Icon className={"h-5 w-5 " + accent} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-0.5 text-2xl font-bold text-[#156cdd] dark:text-white">
              {value}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
