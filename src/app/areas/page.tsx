import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { areasByCounty } from "@/lib/public-areas";

export const metadata: Metadata = {
  title: "Areas we serve",
  description:
    "Permit expediting in Miami-Dade, Broward, and Palm Beach. City-by-city notes on windows, doors, roofing, and renovations.",
};

export default function AreasIndexPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Areas we serve</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Pick the city where the house sits. Each page is a plain explanation of how we help with windows, doors, roofs, and renovations there.
        </p>
        <div className="mt-10 space-y-10">
          {areasByCounty().map((group) => (
            <section key={group.county}>
              <h2 className="text-xl font-semibold text-primary">{group.county}</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {group.areas.map((area) => (
                  <li key={area.slug}>
                    <Link
                      href={`/areas/${area.slug}`}
                      className="block rounded-2xl border border-border p-5 hover:border-primary"
                    >
                      <span className="text-lg font-semibold text-foreground">{area.city}</span>
                      <span className="mt-2 block text-sm text-muted-foreground">
                        Windows, doors, roofs, and renovations in {area.city}.
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm">
          <Link href="/#info" className="font-semibold text-primary">
            Request more info
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/blog" className="text-foreground hover:text-primary">
            Read the blog
          </Link>
        </p>
      </main>
    </PublicShell>
  );
}
