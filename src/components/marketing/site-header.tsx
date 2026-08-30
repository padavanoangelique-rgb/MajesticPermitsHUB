"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

interface SiteHeaderProps {
  /**
   * When true, the section links (How it works, Who it's for, etc.)
   * are rendered as hash links on the current page. When false, they
   * point back to the home page's sections.
   */
  onHome?: boolean;
}

const NAV_ITEMS = [
  { label: "How it works", hash: "#how" },
  { label: "Who it's for", hash: "#who" },
  { label: "Pricing", hash: "#pricing" },
  { label: "FAQ", hash: "#faq" },
  { label: "Contact", href: "/contact" },
];

export function SiteHeader({ onHome = false }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);

  const linkHrefFor = (item: (typeof NAV_ITEMS)[number]) => {
    if ("href" in item && item.href) return item.href;
    return onHome ? item.hash! : `/${item.hash}`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-background-dark/90">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-self-start">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-sm font-bold text-white">
              M
            </div>
            <span className="text-lg font-semibold text-navy dark:text-white">
              Majestic Permits
            </span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 justify-self-center dark:text-slate-300 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={linkHrefFor(item)}
              className="hover:text-navy dark:hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 justify-self-end sm:gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-hover sm:inline-flex"
          >
            Client Login
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 dark:border-slate-800 dark:bg-background-dark md:hidden">
          <nav className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={linkHrefFor(item)}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl bg-navy px-3 py-2.5 text-center text-white hover:bg-navy-hover"
            >
              Client Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
