import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { InquiryForm } from "@/components/public/lead-form";
import { areasByCounty } from "@/lib/public-areas";
import { PUBLIC_HELLO, PUBLIC_PHONE_DISPLAY, PUBLIC_PHONE_TEL } from "@/lib/mailboxes";

export const metadata: Metadata = {
  title: "The Permit Closer",
  description:
    "Got a letter about an open or expired permit? Send your name, email, and the address. We send a free report of what the city still shows.",
  alternates: { canonical: "https://www.majesticpermits.com/permit-closer" },
};

export default function PermitCloserPage() {
  return (
    <PublicShell>
      <article className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
            A Majestic Permits company
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            A letter about an <span className="text-majestic">open permit</span> does not mean you did something wrong.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            The Permit Closer writes homeowners when the public record still shows an open or expired permit. We are not the city. There is nothing you have to buy. If the letter is yours, ask for the free report.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <img src="/work/south-florida-impact-windows.jpg" alt="A South Florida house with impact windows" className="h-28 w-full rounded-2xl object-cover" />
            <img src="/work/florida-tile-reroof.jpg" alt="A tile roof replacement" className="h-28 w-full rounded-2xl object-cover" />
            <img src="/work/impact-sliding-door.jpg" alt="An impact sliding door" className="h-28 w-full rounded-2xl object-cover" />
          </div>
          <ol className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li><span className="font-semibold text-foreground">1. The letter.</span> It names the address and says the record is still open.</li>
            <li><span className="font-semibold text-foreground">2. The free report.</span> We look up what that city still shows: open, expired, or already closed.</li>
            <li><span className="font-semibold text-foreground">3. Only if you want us to.</span> Closing it is a separate job. This form does not start it.</li>
          </ol>
          <p className="mt-5 text-sm text-muted-foreground">
            <a className="font-semibold text-violet-300" href={`tel:${PUBLIC_PHONE_TEL}`}>{PUBLIC_PHONE_DISPLAY}</a>
            <span className="mx-2">·</span>
            <a className="font-semibold text-violet-300" href={`mailto:${PUBLIC_HELLO}`}>{PUBLIC_HELLO}</a>
          </p>
        </div>
        <div id="report" className="rounded-3xl border border-violet-400/30 bg-gradient-to-b from-violet-600/25 to-card/80 p-6">
          <h2 className="text-2xl font-semibold">Get the free permit report</h2>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">Name, email, and the address printed on the letter.</p>
          <InquiryForm intent="permit-report" />
        </div>
      </article>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="text-2xl font-semibold">The city on the letter</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Open the city where the house sits. The mailing city on the envelope is often a different town.
        </p>
        <div className="mt-8 space-y-8">
          {areasByCounty().map((group) => (
            <div key={group.county}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-300">{group.county}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.areas.map((area) => (
                  <li key={area.slug}>
                    <Link
                      href={`/areas/${area.slug}`}
                      className="inline-flex rounded-full border border-violet-400/25 px-3 py-1.5 text-sm text-muted-foreground hover:border-violet-300 hover:text-foreground"
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
