import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/public-shell";
import { getArea } from "@/lib/public-areas";
import { getPost, PUBLIC_POSTS } from "@/lib/public-posts";

type Params = { slug: string };

export function generateStaticParams() {
  return PUBLIC_POSTS.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const post = getPost(params.slug);
  if (!post) return {};
  return { title: post.title, description: post.description };
}

export default function BlogPostPage({ params }: { params: Params }) {
  const post = getPost(params.slug);
  if (!post) notFound();
  const city = getArea(post.citySlug);

  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-sm text-primary">
          <Link href="/blog">Notes</Link>
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">{post.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{post.date}</p>
        <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground">
          {post.blocks.map((block, index) => {
            if (block.type === "h2") {
              return (
                <h2 key={index} className="pt-4 text-2xl font-semibold text-foreground">
                  {block.text}
                </h2>
              );
            }
            if (block.type === "ul") {
              return (
                <ul key={index} className="list-disc space-y-2 pl-5">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );
            }
            return <p key={index}>{block.text}</p>;
          })}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          {city && (
            <Link
              href={`/areas/${city.slug}`}
              className="inline-flex min-h-12 items-center rounded-2xl border border-border px-5 py-3 text-sm font-semibold"
            >
              {city.city} permit page
            </Link>
          )}
          <Link
            href="/#start"
            className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Start a project
          </Link>
        </div>
      </article>
    </PublicShell>
  );
}
