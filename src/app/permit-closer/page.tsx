import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { InquiryForm } from "@/components/public/lead-form";
import { areasByCounty } from "@/lib/public-areas";
import { PUBLIC_HELLO, PUBLIC_PHONE_DISPLAY, PUBLIC_PHONE_TEL } from "@/lib/mailboxes";

export const metadata: Metadata = {
  title: "The Permit Closer",
  description:
    "Answer a Permit Closer letter. Free report on an open or expired permit in every Miami-Dade, Broward, and Palm Beach municipality. Closing it is not the same as pulling a new permit.",
  alternates: { canonical: "https://majesticpermits.com/permit-closer" },
};

export default function PermitCloserPage() {
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Part of Majestic Permits
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">The Permit Closer</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          This page is the reply to a letter. We pull open and expired permits from the public record and mail the address. If that letter is yours, send your name, your email, and the address printed on it. We send back a free report of what that building department still shows.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Open, expired, and closed are not the same word</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          An open permit means the department has not closed the file. The work may be finished, half finished, or never started. An expired permit is still that file: the card ran out and nobody recorded a final. A closed permit is the one a buyer, a lender, or an insurer is usually asking for. The word on a title commitment is often just "open." The report says which of the three the department is actually showing.
        </p>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          The work can look done from the street and still be open downtown. A failed inspection, a missing Notice of Commencement, a contractor who left, or a final that was never called all leave the same open file. Closing it is not a new window permit for the next job.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">What the free report is</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>The address on the letter, and the city that actually has jurisdiction. The mailing city is often wrong.</li>
          <li>Whether the department still shows the permit as open, expired, finaled, or not found.</li>
          <li>The permit number when the record has one, and the last inspection result when it is on the record.</li>
          <li>What is still missing if the file is open: a final, a correction, a recorded Notice of Commencement, or work that was never done.</li>
        </ul>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          The report does not open a permit and it does not promise the city will close one. If the work in the field was never finished, a form will not finish it. We say that in the report.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">What closing it can take</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          If the work is in place, the path is often the inspection that was never called, plus the paper that department still wants. That paper is the city's own set: the application, a Notice of Commencement when the contract amount requires one, an affidavit if they ask for one, and their checklist. Broward jobs also carry the retrofit schedule when the opening work is what was permitted. Miami-Dade and Broward products have to be approved for the high-velocity zone. Palm Beach still needs a product approval and the design pressure for that house.
        </p>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          We do not take another city's form and change the name. If the record shows the work was never built, the honest path is a new permit, and that request is made inside the hub after the company is a client. This page does not start that permit.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Who the letter is for</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Homeowners who bought a house with an open permit. Owners who had windows, a roof, or a remodel and never saw a final. Contractors who inherited a job another company started. If the notice, the title commitment, or the old card has a permit number, put it in the address line with the property. If you only have the address, send that.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          <a className="font-semibold text-accent" href={`mailto:${PUBLIC_HELLO}`}>{PUBLIC_HELLO}</a>
          <span className="mx-2">·</span>
          <a className="font-semibold text-accent" href={`tel:${PUBLIC_PHONE_TEL}`}>{PUBLIC_PHONE_DISPLAY}</a>
          <span className="mx-2">·</span>
          <Link href="/contact" className="font-semibold text-accent">Contact me</Link>
        </p>

        <div className="mt-8">
          <h2 className="text-lg font-semibold">Get the free permit report</h2>
          <p className="mb-3 mt-1 text-sm text-muted-foreground">Name, email, and the address on the letter.</p>
          <InquiryForm intent="permit-report" />
        </div>
      </article>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="text-2xl font-semibold">The city on the letter</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every municipality in the three counties has a page. Open the one that matches the property, not the return address.
        </p>
        <div className="mt-8 space-y-8">
          {areasByCounty().map((group) => (
            <div key={group.county}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-accent">{group.county}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.areas.map((area) => (
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
            </div>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
