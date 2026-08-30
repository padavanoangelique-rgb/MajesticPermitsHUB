import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, ShieldCheck, Zap } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Request Access — Majestic Permits",
  description:
    "Request access to the Majestic Permits contractor portal. We'll verify your company and send login credentials.",
};

export default function RequestAccessPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-background-dark">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold">
            Contractor portal
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-navy dark:text-white sm:text-5xl">
            Request portal access
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            Portal access is invite-only. Tell us about your company and
            we&apos;ll verify and send credentials within one business day.
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <ContactForm
              intent="access"
              submitLabel="Request access"
              showProjectFields={false}
            />
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-surface-dark">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy/10 text-navy dark:bg-gold/10 dark:text-gold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-navy dark:text-white">
                Verified access
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                Every account is manually reviewed and linked to a contractor
                profile before it can see jobs.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-surface-dark">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy/10 text-navy dark:bg-gold/10 dark:text-gold">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-navy dark:text-white">
                What you get
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                <li>• Live status on every permit</li>
                <li>• Inspection requests in one click</li>
                <li>• Document downloads &amp; quotes</li>
                <li>• Automatic homeowner tracking links</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-navy/10 bg-navy/5 p-6 dark:border-gold/20 dark:bg-gold/5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-white">
                <KeyRound className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-navy dark:text-white">
                Already have login?
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                <Link href="/login" className="font-medium underline">
                  Sign in here
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
