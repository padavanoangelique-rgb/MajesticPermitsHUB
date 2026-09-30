import Link from "next/link";
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
import { PublicShell } from "@/components/public/public-shell";
import { LeadForm } from "@/components/public/lead-form";
import { WorkGrid } from "@/components/public/work-grid";
import { PUBLIC_AREAS } from "@/lib/public-areas";
import { PUBLIC_POSTS } from "@/lib/public-posts";
import { PUBLIC_HELLO, PUBLIC_PHONE_DISPLAY, PUBLIC_PHONE_TEL } from "@/lib/mailboxes";

export default function LandingPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Miami-Dade · Broward · Palm Beach
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            We handle your permits.
            <br />
            You build.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Permit expediting for contractors and homeowners. Windows, doors,
            roofing, renovations, and expired-permit close-outs. We build the
            package, file it with the building department, and keep the status
            in plain English.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#start"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-8 py-3 text-base font-semibold text-primary-foreground"
            >
              Start your project
            </a>
            <a
              href="#how"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border px-8 py-3 text-base font-semibold text-foreground"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-border bg-secondary py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">
            Three steps. No chasing the city yourself.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: FileCheck,
                title: "1. Tell us about the project",
                body: "Address, trade, and what you already have. We tell you what the department still needs.",
              },
              {
                icon: Clock,
                title: "2. We run the paperwork",
                body: "Application, product approvals, corrections, and the follow-up the reviewer actually reads.",
              },
              {
                icon: Link2,
                title: "3. You track it on one link",
                body: "A private page. Big status stages. Email when something changes. No password.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-border bg-card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-3 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="who" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for both sides of the job
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-8">
              <Building2 className="h-10 w-10 text-primary" />
              <h3 className="mt-5 text-2xl font-semibold text-foreground">Contractors</h3>
              <ul className="mt-4 space-y-3 text-muted-foreground">
                <li>A portal for the jobs assigned to you</li>
                <li>Status, documents, and inspection requests</li>
                <li>Quotes and a weekly picture of what is open</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-border bg-card p-8">
              <Home className="h-10 w-10 text-primary" />
              <h3 className="mt-5 text-2xl font-semibold text-foreground">Homeowners</h3>
              <ul className="mt-4 space-y-3 text-muted-foreground">
                <li>No login</li>
                <li>One private tracking link</li>
                <li>Stage names a person can read</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-sm font-medium text-muted-foreground">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Licensed & insured
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Miami-Dade · Broward · Palm Beach
          </span>
          <span className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" /> Windows · Doors · Roofing · Renovations
          </span>
        </div>
      </section>

      <section id="areas" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Areas we serve
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Each city runs a different portal and a different checklist. These are the departments we write about and file with most.
              </p>
            </div>
            <Link href="/areas" className="text-sm font-semibold text-primary">
              All cities
            </Link>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {PUBLIC_AREAS.map((area) => (
              <li key={area.slug}>
                <Link
                  href={`/areas/${area.slug}`}
                  className="block rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
                >
                  {area.city}
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {area.county}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="work" className="border-t border-border bg-secondary py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From the job file
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Approvals, sealed plans, and finished openings. Real files go here as they are ready to show. Nothing stock.
          </p>
          <div className="mt-8">
            <WorkGrid />
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple pricing
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            A quote after we see the scope. City fees stay city fees.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-8">
              <h3 className="text-xl font-semibold text-foreground">Per permit</h3>
              <p className="mt-3 text-muted-foreground">
                A fee quoted up front for one application. The right fit for a single house or an occasional project.
              </p>
              <a href="#start" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                Get a quote
              </a>
            </div>
            <div className="rounded-3xl border border-primary/40 bg-primary/5 p-8">
              <h3 className="text-xl font-semibold text-foreground">Retainer</h3>
              <p className="mt-3 text-muted-foreground">
                For contractors with a steady queue. Priority handling and one report instead of a thread of texts.
              </p>
              <a href="#start" className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary">
                Ask about a retainer
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">From the desk</h2>
          <ul className="mt-6 divide-y divide-border">
            {PUBLIC_POSTS.map((post) => (
              <li key={post.slug} className="py-4">
                <Link href={`/blog/${post.slug}`} className="text-lg font-semibold text-foreground hover:text-primary">
                  {post.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{post.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="start" className="border-t border-border bg-secondary py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Start your project
            </h2>
            <p className="mt-4 text-muted-foreground">
              New inquiries become a lead. If we already have your email or phone, this opens a job on that account instead of a second profile.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              Or call{" "}
              <a className="font-semibold text-primary" href={`tel:${PUBLIC_PHONE_TEL}`}>
                {PUBLIC_PHONE_DISPLAY}
              </a>{" "}
              or email{" "}
              <a className="font-semibold text-primary" href={`mailto:${PUBLIC_HELLO}`}>
                {PUBLIC_HELLO}
              </a>
              .
            </p>
          </div>
          <LeadForm />
        </div>
      </section>
    </PublicShell>
  );
}
