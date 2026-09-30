import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { PUBLIC_POSTS } from "@/lib/public-posts";

export const metadata: Metadata = {
  title: "Permit notes",
  description:
    "Plain-English notes on window, door, and reroof permits in Weston, Broward, and Miami-Dade.",
};

export default function BlogIndexPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Permit notes</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Short pieces on how specific departments actually take a package. No filler.
        </p>
        <ul className="mt-10 space-y-6">
          {PUBLIC_POSTS.map((post) => (
            <li key={post.slug} className="rounded-3xl border border-border p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">{post.date}</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-muted-foreground">{post.description}</p>
            </li>
          ))}
        </ul>
      </main>
    </PublicShell>
  );
}
