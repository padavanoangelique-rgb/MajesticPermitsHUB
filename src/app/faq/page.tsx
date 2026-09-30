import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { PUBLIC_FAQS } from "@/lib/public-faq";

export const metadata: Metadata = {
  title: "Permit questions",
  description:
    "Answers on service area, expediting cost, Florida window and door permits, tracking, and The Permit Closer.",
  alternates: { canonical: "https://www.majesticpermits.com/faq" },
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PUBLIC_FAQS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Questions</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Straight answers. If yours is not here, send the project and we will answer it on that address.
        </p>
        <div className="mt-10 space-y-8">
          {PUBLIC_FAQS.map((item) => (
            <section key={item.question}>
              <h2 className="text-xl font-semibold text-foreground">{item.question}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{item.answer}</p>
            </section>
          ))}
        </div>
        <Link
          href="/#info"
          className="mt-10 inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Request more info
        </Link>
      </main>
    </PublicShell>
  );
}
