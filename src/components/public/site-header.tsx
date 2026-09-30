import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandMark } from "@/components/public/brand-mark";

const LINKS = [
  { href: "/areas", label: "Areas" },
  { href: "/permit-closer", label: "Permit Closer" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/#work", label: "Work" },
  { href: "/#info", label: "Register" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <BrandMark />
          <span className="truncate text-base font-semibold text-primary sm:text-lg">
            Majestic Permits
          </span>
        </Link>
        <nav className="order-last flex w-full flex-wrap gap-x-5 gap-y-2 text-sm font-medium md:order-none md:w-auto md:flex-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Client Login
          </Link>
        </div>
      </div>
    </header>
  );
}
