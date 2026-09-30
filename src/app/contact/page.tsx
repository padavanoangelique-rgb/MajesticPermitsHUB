import type { Metadata } from "next";
import { PublicShell } from "@/components/public/public-shell";
import { InquiryForm } from "@/components/public/lead-form";
import { PUBLIC_HELLO, PUBLIC_PHONE_DISPLAY, PUBLIC_PHONE_TEL } from "@/lib/mailboxes";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Email Majestic Permits. Leave your name and email. New permits are requested inside the hub after a company is onboarded.",
  alternates: { canonical: "https://majesticpermits.com/contact" },
};

export default function ContactPage() {
  return (
    <PublicShell>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Contact me</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Leave your name and email. We write back. This is not a permit application.
          </p>
          <p className="mt-6 text-muted-foreground">
            Clients request a new permit from inside the hub after onboarding. If you already have a login, use Client Login.
          </p>
          <p className="mt-6 text-sm">
            <a className="font-semibold text-accent" href={`mailto:${PUBLIC_HELLO}`}>{PUBLIC_HELLO}</a>
            <span className="mx-2 text-muted-foreground">·</span>
            <a className="font-semibold text-accent" href={`tel:${PUBLIC_PHONE_TEL}`}>{PUBLIC_PHONE_DISPLAY}</a>
          </p>
        </div>
        <InquiryForm intent="contact" />
      </section>
    </PublicShell>
  );
}
