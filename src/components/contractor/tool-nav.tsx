import Link from "next/link";

const TOOLS = [
  { href: "/dashboard/company", label: "License and insurance" },
  { href: "/dashboard/forms", label: "Forms" },
  { href: "/dashboard/lookup", label: "Property lookup" },
  { href: "/dashboard/measure", label: "Measure" },
  { href: "/dashboard/install", label: "Install board" },
  { href: "/dashboard/inspections", label: "Inspections" },
];

export function ToolNav({ current }: { current?: string }) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      <Link
        href="/dashboard"
        className="shrink-0 rounded-full border border-border px-3 py-2 text-sm text-muted-foreground"
      >
        Dashboard
      </Link>
      {TOOLS.map((tool) => (
        <Link
          key={tool.href}
          href={tool.href}
          className={
            "shrink-0 rounded-full px-3 py-2 text-sm " +
            (current === tool.href
              ? "bg-primary font-semibold text-white"
              : "border border-violet-400/30 text-foreground")
          }
        >
          {tool.label}
        </Link>
      ))}
    </nav>
  );
}
