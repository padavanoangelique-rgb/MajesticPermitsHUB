import Link from "next/link";

const TOOLS = [
  { href: "/dashboard/company", label: "License and insurance", blurb: "License, COI, and expiration dates" },
  { href: "/dashboard/forms", label: "Forms", blurb: "Fill a form and send it to sign" },
  { href: "/dashboard/lookup", label: "Property lookup", blurb: "County appraiser for the address" },
  { href: "/dashboard/measure", label: "Measure", blurb: "Window and door sizes on the phone" },
  { href: "/dashboard/install", label: "Install board", blurb: "Approved jobs and inspection dates" },
  { href: "/dashboard/inspections", label: "Inspections", blurb: "Request or check a visit" },
];

export function ToolNav({ current }: { current?: string }) {
  if (!current) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-2xl border border-violet-400/25 bg-card/80 px-4 py-4 transition hover:border-violet-300"
          >
            <p className="text-sm font-semibold">{tool.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tool.blurb}</p>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <Link href="/dashboard" className="shrink-0 rounded-full border border-border px-3 py-2 text-sm">
        Dashboard
      </Link>
      {TOOLS.map((tool) => (
        <Link
          key={tool.href}
          href={tool.href}
          className={
            "shrink-0 rounded-full px-3 py-2 text-sm " +
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
    <main className="mx-auto max-w-xl px-4 py-6">
      <ToolNav current={current} />
      <h1 className="mt-6 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{lede}</p>
      <div className="mt-6 rounded-3xl border border-violet-400/20 bg-card/80 p-4 sm:p-5">{children}</div>
    </main>
  );
}
