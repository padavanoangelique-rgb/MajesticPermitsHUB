import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Contact — Majestic Permits",
  description:
    "Tell us about your permit project. We serve contractors and homeowners across Miami-Dade, Broward, and Palm Beach.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-background-dark">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold">
            Start your project
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-navy dark:text-white sm:text-5xl">
            Tell us about your permit
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            Share a few details and we&apos;ll come back with a quote and next
            steps — usually the same business day.
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <ContactForm intent="quote" submitLabel="Request a quote" />
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-surface-dark">
              <h2 className="text-lg font-semibold text-navy dark:text-white">
                Reach us directly
              </h2>
              <ul className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-navy dark:text-gold" />
                  <div>
                    <p className="font-medium text-navy dark:text-white">
                      Email
                    </p>
                    <a
                      href="mailto:hello@majesticpermits.com"
                      className="hover:underline"
                    >
                      hello@majesticpermits.com
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-navy dark:text-gold" />
                  <div>
                    <p className="font-medium text-navy dark:text-white">
                      Phone
                    </p>
                    <a href="tel:+15618883805" className="hover:underline">
                      (561) 888-3805
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-navy dark:text-gold" />
                  <div>
                    <p className="font-medium text-navy dark:text-white">
                      Coverage
                    </p>
                    <p>Miami-Dade · Broward · Palm Beach</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-navy dark:text-gold" />
                  <div>
                    <p className="font-medium text-navy dark:text-white">
                      Hours
                    </p>
                    <p>Mon–Fri · 8am–6pm ET</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-navy/10 bg-navy/5 p-6 dark:border-gold/20 dark:bg-gold/5">
              <h2 className="text-lg font-semibold text-navy dark:text-white">
                Already a client?
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Sign in to your contractor portal to track live status and
                request inspections.
              </p>
              <a
                href="/login"
                className="mt-4 inline-flex rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-hover"
              >
                Client Login
              </a>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
