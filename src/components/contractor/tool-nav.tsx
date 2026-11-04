import Link from "next/link";

const TOOLS = [
  { href: "/dashboard/company", label: "License", blurb: "COI & dates" },
  { href: "/dashboard/forms", label: "Forms", blurb: "Send to sign" },
  { href: "/dashboard/lookup", label: "Lookup", blurb: "Appraiser" },
  { href: "/dashboard/measure", label: "Measure", blurb: "Sizes" },
  { href: "/dashboard/install", label: "Install", blurb: "Jobs" },
  { href: "/dashboard/inspections", label: "Inspections", blurb: "Visits" },
];

export function ToolNav({ current }: { current?: string }) {
  if (!current) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="shrink-0 flex flex-col items-center justify-center min-w-[72px] rounded-xl border border-violet-400/30 bg-card/80 px-3 py-2.5 text-center transition hover:border-violet-300 hover:bg-card"
          >
            <p className="text-xs font-semibold leading-tight">{tool.label}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{tool.blurb}</p>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <Link href="/dashboard" className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs">
        Dashboard
      </Link>
      {TOOLS.map((tool) => (
        <Link
          key={tool.href}
          href={tool.href}
          className={
            "shrink-0 rounded-full px-3 py-1.5 text-xs " +
            (current === tool.href ? "bg-primary font-semibold text-white" : "border border-violet-400/30")
          }
        >
          {tool.label}
        </Link>
      ))}
    </nav>
  );
}

export function ToolPage({
  title,
  lede,
  current,
  children,
}: {
  title: string;
  lede: string;
  current: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-xl px-4 py-5">
      <ToolNav current={current} />
      <h1 className="mt-5 text-xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{lede}</p>
      <div className="mt-4 rounded-2xl border border-violet-400/20 bg-card/80 p-4">{children}</div>
    </main>
  );
}
