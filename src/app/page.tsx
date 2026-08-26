import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  FileCheck,
  Clock,
  Link2,
  Building2,
  Home,
  ShieldCheck,
  MapPin,
  Wrench,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-background-dark">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-background-dark/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-sm font-bold text-white">
              M
            </div>
            <span className="text-lg font-semibold text-navy dark:text-white">
              Majestic Permits
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <a href="#how" className="hover:text-navy dark:hover:text-white">
              How it Works
            </a>
            <a href="#who" className="hover:text-navy dark:hover:text-white">
              Who it&apos;s for
            </a>
            <a href="#pricing" className="hover:text-navy dark:hover:text-white">
              Pricing
            </a>
            <a href="#contact" className="hover:text-navy dark:hover:text-white">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-hover"
            >
              Client Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold">
            South Florida&apos;s premier permit management
          </span>

          <h1 className="mt-8 text-5xl font-bold tracking-tight text-navy dark:text-white sm:text-6xl md:text-7xl">
            We handle your permits.
            <br />
            You build.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300 sm:text-xl">
            Majestic Permits is a white-glove permitting service for contractors
            and homeowners across South Florida. From application to final
            inspection — we make it painless.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#contact"
              className="rounded-2xl bg-navy px-8 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-navy-hover"
            >
              Start your project
            </a>
            <a
              href="#how"
              className="rounded-2xl border border-slate-300 px-8 py-4 text-base font-semibold text-navy transition hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Placeholder product mock */}
        <div className="mt-16 overflow-hidden rounded-3xl border border-slate-200 bg-surface-light shadow-soft-lg dark:border-slate-700 dark:bg-surface-dark">
          <div className="flex h-64 items-center justify-center text-muted-foreground sm:h-80">
            <p className="text-sm">Contractor dashboard preview</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-slate-100 bg-surface-light py-20 dark:border-slate-800 dark:bg-background-dark">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-navy dark:text-white sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-600 dark:text-slate-300">
            Three simple steps. No jargon. No chasing the city.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: FileCheck,
                title: "1. Tell us about your project",
                body: "A short intake. We collect what we need and prepare the package.",
              },
              {
                icon: Clock,
                title: "2. We handle the paperwork",
                body: "Applications, corrections, follow-ups with the city — all of it.",
              },
              {
                icon: Link2,
                title: "3. You track everything in real time",
                body: "One private link. Big, clear status stages. Email updates when anything changes.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-surface-dark"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/10 text-navy dark:bg-gold/10 dark:text-gold">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-navy dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-slate-600 dark:text-slate-300">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="who" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-navy dark:text-white sm:text-4xl">
            Built for both sides of the job
          </h2>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-surface-dark">
              <Building2 className="h-10 w-10 text-navy dark:text-gold" />
              <h3 className="mt-5 text-2xl font-semibold text-navy dark:text-white">
                Contractors
              </h3>
              <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
                <li>• Private portal for all your projects</li>
                <li>• Real-time status and document access</li>
                <li>• Inspection request button</li>
                <li>• Quotes, invoices, and notifications</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-surface-dark">
              <Home className="h-10 w-10 text-navy dark:text-gold" />
              <h3 className="mt-5 text-2xl font-semibold text-navy dark:text-white">
                Homeowners
              </h3>
              <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
                <li>• No login or password required</li>
                <li>• One private tracking link</li>
                <li>• Plain-English stage explanations</li>
                <li>• Automatic email updates</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-slate-100 bg-surface-light py-10 dark:border-slate-800 dark:bg-background-dark">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-8 px-4 text-sm font-medium text-slate-500 sm:gap-12">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" /> Licensed & insured
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gold" /> Miami-Dade · Broward · Palm Beach
          </span>
          <span className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-gold" /> Windows · Doors · Roofing · Renovations
          </span>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-navy dark:text-white sm:text-4xl">
            Simple pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-600 dark:text-slate-300">
            Clear upfront fees. No surprises.
          </p>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-surface-dark">
              <h3 className="text-xl font-semibold text-navy dark:text-white">
                Per-permit
              </h3>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                Flat fee quoted upfront for each permit application. Ideal for
                one-off or occasional projects.
              </p>
              <a
                href="#contact"
                className="mt-6 inline-flex rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-hover"
              >
                Get a quote
              </a>
            </div>

            <div className="rounded-3xl border border-gold/40 bg-gold/5 p-8 dark:bg-gold/10">
              <h3 className="text-xl font-semibold text-navy dark:text-white">
                Retainer
              </h3>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                Monthly plan for contractors with ongoing volume. Priority
                handling and consolidated reporting.
              </p>
              <a
                href="#contact"
                className="mt-6 inline-flex rounded-xl border border-navy px-5 py-2.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white dark:border-gold dark:text-gold dark:hover:bg-gold dark:hover:text-navy"
              >
                Contact for pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mx-auto mb-6 h-1 w-16 rounded-full bg-gold" />
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Ready to stop chasing permits?
          </h2>
          <p className="mt-5 text-lg text-slate-300">
            Tell us about your next project. We&apos;ll take it from there.
          </p>
          <a
            href="#contact"
            className="mt-10 inline-flex rounded-2xl bg-white px-8 py-4 text-base font-semibold text-navy transition hover:bg-slate-100"
          >
            Start your project
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-background-dark">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-sm font-bold text-white">
                  M
                </div>
                <span className="text-lg font-semibold text-navy dark:text-white">
                  Majestic Permits
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-slate-500">
                White-glove permitting for South Florida contractors and
                homeowners.
              </p>
            </div>

            <div className="text-sm text-slate-500">
              <p>hello@majesticpermits.com</p>
              <p className="mt-1">(305) 555-0100</p>
              <p className="mt-4">© {new Date().getFullYear()} Majestic Permits</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
