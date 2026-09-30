import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/public-shell";
import { getArea, allAreas } from "@/lib/public-areas";

type Params = { slug: string };

export function generateStaticParams() {
  return allAreas().map((area) => ({ slug: area.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const area = getArea(params.slug);
  if (!area) return {};
  return {
    title: `${area.city} permits`,
    description: `Windows, doors, roofs, and renovations in ${area.city}. Majestic Permits handles the paperwork, the updates, and the inspections.`,
  };
}

export default function AreaPage({ params }: { params: Params }) {
  const area = getArea(params.slug);
  if (!area) notFound();

  const related = area.related
    .map((slug) => getArea(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const jobs = [
    {
      title: "Windows",
      text: `Replacing windows in ${area.city}? We prepare the permit, track the review, and tell you when it is approved.`,
    },
    {
      title: "Doors",
      text: `Entry doors and sliders are their own permit. We keep that job next to the window work so nothing is left off.`,
    },
    {
      title: "Roofing",
      text: `A new roof in ${area.city} is a separate permit from the openings. We run it with the same updates you already get.`,
    },
    {
      title: "Renovations",
      text: `Kitchens, baths, and other interior work stay on one timeline, with the inspections called when the city is ready for them.`,
    },
  ];

  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-sm font-medium text-violet-300">
          <Link href="/areas">Areas</Link>
          <span className="text-muted-foreground"> · {area.county} County</span>
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          Permits in <span className="text-majestic">{area.city}</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          If the house is in {area.city}, this is the building department that reviews the work.
          Majestic Permits is the team that files it, watches it, and keeps you posted. You stay
          on the job. We sit with the city.
        </p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {jobs.map((job) => (
            <li key={job.title} className="rounded-2xl border border-violet-400/20 bg-card/80 px-4 py-4">
              <p className="font-semibold text-foreground">{job.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{job.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-600/25 to-card/70 p-6">
          <h2 className="text-xl font-semibold text-foreground">Got a letter about an old permit?</h2>
          <p className="mt-2 text-muted-foreground">
            An open or expired permit in {area.city} is not a new job. Ask for a free report of what
            the city still shows. There is nothing to buy just to find out.
          </p>
          <Link href="/permit-closer" className="mt-4 inline-flex font-semibold text-violet-300">
            Get the free permit report
          </Link>
        </div>

        <div className="mt-8">
          <Link
            href="/#info"
            className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Request more info
          </Link>
        </div>

        <h2 className="mt-12 text-xl font-semibold text-foreground">Nearby</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {related.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/areas/${item.slug}`}
                className="inline-flex rounded-full border border-violet-400/25 px-4 py-2 text-sm hover:border-violet-300"
              >
                {item.city}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/areas" className="inline-flex rounded-full border border-border px-4 py-2 text-sm">
              All areas
            </Link>
          </li>
        </ul>
      </main>
    </PublicShell>
  );
}
