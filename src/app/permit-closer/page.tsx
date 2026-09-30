import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { InquiryForm } from "@/components/public/lead-form";
import { PUBLIC_HELLO, PUBLIC_PHONE_DISPLAY, PUBLIC_PHONE_TEL } from "@/lib/mailboxes";

export const metadata: Metadata = {
  title: "The Permit Closer",
  description:
    "Answer a Permit Closer letter and get a free report on an open or expired permit in Miami-Dade, Broward, or Palm Beach. New permits are requested inside the Majestic hub after onboarding.",
  alternates: { canonical: "https://majesticpermits.com/permit-closer" },
};

export default function PermitCloserPage() {
  return (
    <PublicShell>
      <article className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Part of Majestic Permits
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            The Permit Closer
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            This is where you answer a letter. The lead list finds open and expired permits. The letter goes to that address. This page is the reply.
          </p>
          <h2 className="mt-8 text-2xl font-semibold">What an expired permit means</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            The work may be done, or it may have stopped years ago, and the building department can still show the permit as open. That is the file a buyer, a lender, or a notice is pointing at. Closing it is not the same as pulling a new permit for the next job.
          </p>
          <h2 className="mt-8 text-2xl font-semibold">The free report</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Send the email and the address on the letter. We reply with what the department still shows. That report does not open a permit. If the company needs new permits after that, we onboard first, and the request is made inside the hub.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            <a className="font-semibold text-accent" href={`mailto:${PUBLIC_HELLO}`}>{PUBLIC_HELLO}</a>
            <span className="mx-2">·</span>
            <a className="font-semibold text-accent" href={`tel:${PUBLIC_PHONE_TEL}`}>{PUBLIC_PHONE_DISPLAY}</a>
          </p>
          <p className="mt-6 text-sm">
            <Link href="/" className="font-semibold text-accent">Majestic Permits</Link>
            <span className="mx-2 text-muted-foreground">·</span>
            <Link href="/contact" className="font-semibold text-accent">Contact me</Link>
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Get the free permit report</h2>
          <p className="mb-3 mt-1 text-sm text-muted-foreground">Name, email, and the address on the letter.</p>
          <InquiryForm intent="permit-report" />
        </div>
      </article>
    </PublicShell>
  );
}
