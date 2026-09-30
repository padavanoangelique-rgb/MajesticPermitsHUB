import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  Clock3,
  FileCheck,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { InquiryForm } from "@/components/public/lead-form";
import { PUBLIC_AREAS } from "@/lib/public-areas";
import { PUBLIC_FAQS } from "@/lib/public-faq";
import { PUBLIC_POSTS } from "@/lib/public-posts";
import { PUBLIC_HELLO, PUBLIC_PHONE_DISPLAY, PUBLIC_PHONE_TEL } from "@/lib/mailboxes";

export const metadata: Metadata = {
  title: {
    absolute: "Majestic Permits | Expediting in Miami-Dade, Broward, and Palm Beach",
  },
  description:
    "Permit expediting for windows, doors, roofing, renovations, and expired-permit close-outs. Contractors get a portal. Homeowners get a private link. The Permit Closer handles stuck permits.",
  alternates: { canonical: "https://majesticpermits.com" },
};

const PACKAGE = [
  ["City-ready application", "The form and drawings that department actually reviews."],
  ["Product approval check", "The notice or Florida approval matched to the opening."],
  ["Portal filing", "Uploaded in that city’s system, not a stack of email."],
  ["Correction replies", "Comments answered where the reviewer will see them."],
  ["Inspection follow-through", "Scheduled, resulted, and written back to you."],
  ["Expired permit close-out", "The Permit Closer path when the permit is already stuck."],
];

const STAGES = [
  "Getting your project ready",
  "Submitted to the city",
  "Under review",
  "Approved — ready to build",
];

const PHOTOS = [
  {
    src: "/work/south-florida-impact-windows.jpg",
    alt: "South Florida house with impact windows",
    label: "Impact windows",
    className: "sm:col-span-5 sm:col-start-1",
  },
  {
    src: "/work/florida-tile-reroof.jpg",
    alt: "Clay tile roof replacement underway on a Florida house",
    label: "Reroof",
    className: "sm:col-span-4 sm:col-start-8 sm:mt-28",
  },
  {
    src: "/work/impact-sliding-door.jpg",
    alt: "New impact sliding glass door on a Florida patio",
    label: "Impact door",
    className: "sm:col-span-4 sm:col-start-3 sm:mt-4",
  },
];

const CONTRACTOR_HUB = [
  ["Every job in one login", "Jobs sit in plain groups: getting ready, in review, approved, needs inspection, and closed."],
  ["Request the next job", "Address, trade, and what you already have. You do not email a pile of files to get on the list."],
  ["Plans in, filed set out", "Upload what you have. Download the documents we share back."],
  ["Inspection dates", "Ask for a day. See requested, scheduled, passed, partial, or follow-up."],
  ["A link for your customer", "You send a private page. They do not get your login, and they do not need a password."],
];

const CUSTOMER_HUB = [
  ["A private link", "No account. The page is not listed in search."],
  ["Plain status", "The stage, what happens next, and a note written for that job."],
  ["The permit itself", "Number, the day it was submitted, and the date we are working toward."],
  ["Inspections they should see", "Only the visits we mark for them: requested, scheduled, or resulted."],
  ["Shared files", "Plans and letters we choose to put on that page."],
  ["Ask for an inspection", "From the same link, when the job is ready for one."],
];

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Majestic Permits",
    url: "https://majesticpermits.com",
    telephone: "+1-561-888-3805",
    email: PUBLIC_HELLO,
    areaServed: ["Miami-Dade County", "Broward County", "Palm Beach County"],
    description:
      "Permit expediting for windows, doors, roofing, renovations, and expired permits in South Florida.",
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <img
        src="/work/miami-glass-tower-dusk.jpg"
        alt=""
        className="pointer-events-none absolute -right-[8%] top-0 hidden h-[720px] w-[58%] object-cover opacity-20 dark:opacity-40 sm:block"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/30 via-background/75 to-background" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-background via-background/88 to-transparent sm:w-[72%]" />

      <header className="relative z-20 mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            M
          </span>
          <span className="text-lg font-semibold tracking-tight">Majestic Permits</span>
        </Link>
        <nav className="order-last flex w-full flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground md:order-none md:w-auto md:flex-1">
          <Link href="/areas" className="hover:text-foreground">Areas</Link>
          <Link href="/permit-closer" className="hover:text-foreground">Permit Closer</Link>
          <Link href="/blog" className="hover:text-foreground">Blog</Link>
          <Link href="/faq" className="hover:text-foreground">FAQ</Link>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            Client Login
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section id="start" className="mx-auto grid max-w-6xl items-start gap-8 px-4 pb-8 pt-6 sm:px-6 lg:grid-cols-2 lg:pt-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Permits. Handled. South Florida.
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              File a <span className="text-majestic">complete</span> permit package.
            </h1>
            <div className="mt-5 h-1 w-16 rounded-full bg-primary" />
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Windows, doors, roofing, renovations, and expired-permit close-outs
              in Miami-Dade, Broward, and Palm Beach. We build the package, file
              it, and keep the status in plain English.
            </p>
            <p className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-foreground">
              <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
              <span>
                City-specific filing. One private tracking link. No password for homeowners.
              </span>
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              <a className="font-semibold text-accent" href={`tel:${PUBLIC_PHONE_TEL}`}>
                {PUBLIC_PHONE_DISPLAY}
              </a>
              <span className="mx-2">·</span>
              <a className="font-semibold text-accent" href={`mailto:${PUBLIC_HELLO}`}>
                {PUBLIC_HELLO}
              </a>
            </p>
          </div>
          <div id="info">
            <h2 className="text-lg font-semibold">Request more info</h2>
            <p className="mb-3 mt-1 text-sm text-muted-foreground">
              Name, email, and company. New customers are onboarded first. A new permit is requested inside the hub after that, not from this page.
            </p>
            <InquiryForm intent="more-info" />
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:px-6 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="rounded-3xl border border-border bg-card/90 p-6 backdrop-blur-sm sm:p-7">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-8 w-8 text-accent" />
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-accent">The package</h2>
                <p className="text-sm text-muted-foreground">Everything the department needs. Done in order.</p>
              </div>
            </div>
            <ul className="mt-6 space-y-4">
              {PACKAGE.map(([title, body]) => (
                <li key={title} className="flex gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
              Human-run. Filed in the city’s portal. Ready for review.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-sm sm:p-5">
            <div className="flex items-center justify-between border-b border-border px-2 pb-3">
              <h2 className="text-sm font-semibold">Permit status</h2>
              <p className="text-xs text-muted-foreground">Example · not a live job</p>
            </div>
            <div className="mt-4 rounded-2xl border border-border bg-secondary p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">Window replacement</p>
                  <p className="text-sm text-muted-foreground">Broward · impact openings</p>
                </div>
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-accent">
                  Getting ready
                </span>
              </div>
              <ol className="mt-5 space-y-3">
                {STAGES.map((stage, index) => (
                  <li key={stage} className="flex items-center gap-3 text-sm">
                    <span
                      className={
                        index === 0
                          ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                          : "flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-muted-foreground"
                      }
                    >
                      {index === 0 ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    <span className={index === 0 ? "text-foreground" : "text-muted-foreground"}>{stage}</span>
                  </li>
                ))}
              </ol>
            </div>
            <a
              href="#info"
              className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary"
            >
              Request more info
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Clock3, "One desk", "You are not chasing three portals and an association at once."],
              [ShieldCheck, "City checklists", "Weston is not Miami. We use the packet that city published."],
              [Link2, "Plain status", "Homeowners get one private link. No login."],
              [FileCheck, "Close-outs too", "Stuck and expired permits are a real job, not a side note."],
            ].map(([Icon, title, body]) => {
              const ItemIcon = Icon as typeof Clock3;
              return (
                <div key={title as string} className="bg-card p-5">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground">
                    <ItemIcon className="h-4 w-4 text-accent" />
                    {title as string}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body as string}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">Two ways to follow the job</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Contractors sign in. Homeowners do not. Same permit, two pages, so nobody is digging through email to see where it stands.
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="text-xl font-semibold">Contractor portal</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                After you are a client, Client Login opens your jobs. A quote can be approved from the link we send. A weekly note lists what is still open.
              </p>
              <ul className="mt-5 space-y-4">
                {CONTRACTOR_HUB.map(([title, body]) => (
                  <li key={title}>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </li>
                ))}
              </ul>
              <Link href="/login" className="mt-6 inline-flex text-sm font-semibold text-accent">
                Client login
              </Link>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="text-xl font-semibold">Customer link</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The homeowner page is the one we text or email. It is not a second product and it is not a password they will forget.
              </p>
              <ul className="mt-5 space-y-4">
                {CUSTOMER_HUB.map(([title, body]) => (
                  <li key={title}>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="expired" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Expired permits</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">An expired permit is still an open file.</h2>
              <p className="mt-3 text-muted-foreground">
                The city can still show the permit as open after the work stopped, the contractor left, or the final inspection never happened. A letter from The Permit Closer means we already pulled that address from the lead list. This page is where you answer it.
              </p>
              <p className="mt-3 text-muted-foreground">
                The free permit report tells you what the department still shows. It is not a new permit. New permits are requested by clients inside the hub, after we onboard the company.
              </p>
              <p className="mt-4 text-sm">
                <Link href="/permit-closer" className="font-semibold text-accent">How The Permit Closer works</Link>
                <span className="mx-2 text-muted-foreground">·</span>
                <Link href="/contact" className="font-semibold text-accent">Contact me</Link>
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Free permit report</h3>
              <p className="mb-3 mt-1 text-sm text-muted-foreground">
                Your email and the address on the letter. We reply with the report.
              </p>
              <InquiryForm intent="permit-report" />
            </div>
          </div>
        </section>

        <section id="work" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-2xl font-semibold sm:text-3xl">From the job</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Openings, roofs, and the buildings these permits are for.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-y-14 sm:grid-cols-12 sm:gap-x-10">
            {PHOTOS.map((photo) => (
              <figure key={photo.src} className={photo.className}>
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl"
                />
                <figcaption className="mt-3 text-sm text-muted-foreground">{photo.label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="blog" className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">From the blog</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                City sheets and the mistakes that stall a package. New posts go here.
              </p>
            </div>
            <Link href="/blog" className="text-sm font-semibold text-accent">
              All posts
            </Link>
          </div>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {PUBLIC_POSTS.map((post) => (
              <li key={post.slug}>
                <article className="h-full rounded-3xl border border-border bg-card p-5">
                  <time dateTime={post.date} className="text-xs text-muted-foreground">
                    {post.date}
                  </time>
                  <h3 className="mt-2 text-lg font-semibold">
                    <Link href={`/blog/${post.slug}`} className="hover:text-accent">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{post.description}</p>
                </article>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">Questions</h2>
          <dl className="mt-6 space-y-6">
            {PUBLIC_FAQS.map((item) => (
              <div key={item.question}>
                <dt className="font-semibold">{item.question}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.answer}</dd>
              </div>
            ))}
          </dl>
          <Link href="/faq" className="mt-6 inline-flex text-sm font-semibold text-accent">
            FAQ page
          </Link>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Areas</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {PUBLIC_AREAS.map((area) => (
              <li key={area.slug}>
                <Link
                  href={`/areas/${area.slug}`}
                  className="inline-flex rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  {area.city}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <p>majesticpermits.com</p>
          <p className="flex flex-wrap gap-4">
            <Link href="/areas" className="hover:text-foreground">Areas</Link>
            <Link href="/permit-closer" className="hover:text-foreground">Permit Closer</Link>
            <Link href="/blog" className="hover:text-foreground">Blog</Link>
            <Link href="/faq" className="hover:text-foreground">FAQ</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
            <a href={`mailto:${PUBLIC_HELLO}`} className="hover:text-foreground">{PUBLIC_HELLO}</a>
            <a href={`tel:${PUBLIC_PHONE_TEL}`} className="hover:text-foreground">{PUBLIC_PHONE_DISPLAY}</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
