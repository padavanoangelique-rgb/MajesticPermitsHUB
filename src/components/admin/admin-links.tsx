import Link from "next/link";

const LINKS = [
  { href: "/admin/contractors", label: "Contractor files", blurb: "License, insurance, and their jobs" },
  { href: "/admin/forms", label: "Signed forms", blurb: "What they sent and who signed" },
  { href: "/admin/install", label: "Install board", blurb: "Approved jobs and inspection dates" },
  { href: "/admin/inspections", label: "Inspections", blurb: "Visits waiting on you" },
];

export function AdminLinks({ current }: { current?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            "rounded-2xl border px-4 py-4 " +
            (current === link.href
              ? "border-violet-300 bg-gradient-to-br from-[#3b1d78] to-[#1a1038]"
              : "border-violet-400/25 bg-card/80")
          }
        >
          <p className="text-sm font-semibold">{link.label}</p>
          <p className={"mt-1 text-xs leading-relaxed " + (current === link.href ? "text-violet-100/80" : "text-muted-foreground")}>
            {link.blurb}
          </p>
        </Link>
      ))}
    </div>
  );
}
