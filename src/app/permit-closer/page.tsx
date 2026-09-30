import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { LeadForm } from "@/components/public/lead-form";
import { PUBLIC_HELLO, PUBLIC_PHONE_DISPLAY, PUBLIC_PHONE_TEL } from "@/lib/mailboxes";

export const metadata: Metadata = {
  title: "The Permit Closer",
  description:
    "The Permit Closer is Majestic Permits for an open, expired, or stuck permit in Miami-Dade, Broward, or Palm Beach. We find what is still open and what the department still wants.",
  alternates: { canonical: "https://majesticpermits.com/permit-closer" },
};

export default function PermitCloserPage() {
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Part of Majestic Permits
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          The Permit Closer
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          This is the homeowner side of a permit that is already open, expired, or stuck in Miami-Dade, Broward, or Palm Beach. Majestic Permits still runs new window, door, roof, and renovation permits. The Closer is how we take the one that never got finished.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">What we actually do</h2>
        <ul className="mt-4 space-y-3 text-muted-foreground">
          <li>Look up what the building department still shows as open on that address.</li>
          <li>Read the comments, the failed inspection, or the missing paper that stopped it.</li>
          <li>Tell you what it takes to close it, including when a new permit is the honest path.</li>
          <li>File the close-out, or the replacement package, in that city’s portal.</li>
          <li>Put the status on the same private Majestic link. No second login and no second brand page to check.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold">Who it is for</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Homeowners who bought a house with an open permit, or who had work done and never saw a final. Contractors who inherited a job another company started. If the permit number is on a notice, a title commitment, or an old card, send it. If you only have the address, send that. We will say if we cannot see a record.
        </p>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          We do not promise the city will close a permit that still needs work in the field. We do promise you will know which of those it is before anyone pretends a form will finish it.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">How it stays attached to Majestic</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Choose The Permit Closer on the form. The job is still a Majestic job. Calls and email go to the same desk:{" "}
          <a className="font-semibold text-accent" href={`tel:${PUBLIC_PHONE_TEL}`}>{PUBLIC_PHONE_DISPLAY}</a>
          {" "}and{" "}
          <a className="font-semibold text-accent" href={`mailto:${PUBLIC_HELLO}`}>{PUBLIC_HELLO}</a>.
          A new person is a lead. If we already have your phone or email, this stays on that account.
        </p>

        <div className="mt-8">
          <LeadForm compact defaultBrand="The Permit Closer" />
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          <Link href="/" className="font-semibold text-accent">Majestic Permits</Link>
          {" "}runs the new permit.{" "}
          <Link href="/faq" className="font-semibold text-accent">FAQ</Link>
          {" "}covers cost, product approvals, and tracking.
        </p>
      </article>
    </PublicShell>
  );
}
