import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/public-shell";
import { getArea, allAreas } from "@/lib/public-areas";
import { PUBLIC_POSTS } from "@/lib/public-posts";

type Params = { slug: string };

export function generateStaticParams() {
  return allAreas().map((area) => ({ slug: area.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const area = getArea(params.slug);
  if (!area) return {};
  return {
    title: `${area.city} permit expediter`,
    description: area.description,
  };
}

export default function AreaPage({ params }: { params: Params }) {
  const area = getArea(params.slug);
  if (!area) notFound();

  const related = area.related
    .map((slug) => getArea(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const posts = PUBLIC_POSTS.filter((post) => post.citySlug === area.slug);

  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-sm font-medium text-primary">
          <Link href="/areas">Areas</Link>
          <span className="text-muted-foreground"> · {area.county} County</span>
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          {area.city} permit expediter
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{area.intro}</p>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">What we watch</h2>
        <ul className="mt-4 space-y-3 text-muted-foreground">
          {area.watch.map((item) => (
            <li key={item} className="rounded-2xl border border-border bg-card px-4 py-3">
              {item}
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">Windows</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{area.windows}</p>
        <h2 className="mt-8 text-2xl font-semibold text-foreground">Doors</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{area.doors}</p>
        <h2 className="mt-8 text-2xl font-semibold text-foreground">Roofing</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{area.roofing}</p>
        <h2 className="mt-8 text-2xl font-semibold text-foreground">Renovation</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{area.renovation}</p>

        {posts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-foreground">Related reading</h2>
            <ul className="mt-3 space-y-2">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="font-medium text-primary">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2 className="mt-10 text-2xl font-semibold text-foreground">The packet</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {area.county === "Broward"
            ? `${area.city} gets the Broward packet plus anything this city publishes on its own: the building application, the retrofit window and door schedule, the product-approval sheets with the model marked, the floor plan, and a Notice of Commencement when the job requires one. An affidavit or a checklist is included only when ${area.city} actually asks for it.`
            : area.county === "Miami-Dade"
              ? `${area.city} gets the Miami-Dade packet plus this city's own sheets when it has them: the application, the opening schedule, the Notice of Acceptance pages with the model marked, the floor plan, and a Notice of Commencement when the job requires one. We do not file a Broward retrofit form here.`
              : `${area.city} gets the Palm Beach packet plus this city's own sheets when it has them: the application, the opening schedule, the product approval with the model marked, the floor plan, and a Notice of Commencement when the job requires one.`}
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/#info"
            className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Request more info
          </Link>
          <Link
            href="/permit-closer"
            className="inline-flex min-h-12 items-center rounded-2xl border border-border px-6 py-3 text-sm font-semibold"
          >
            Expired permit
          </Link>
        </div>

        <h2 className="mt-12 text-xl font-semibold text-foreground">Other cities</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {related.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/areas/${item.slug}`}
                className="inline-flex rounded-full border border-border px-4 py-2 text-sm hover:border-primary hover:text-primary"
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
          <li>
            <Link href="/" className="inline-flex rounded-full border border-border px-4 py-2 text-sm">
              Home
            </Link>
          </li>
        </ul>
      </main>
    </PublicShell>
  );
}
