import { Mail, Phone, MessageSquare } from "lucide-react";

export function ContactCard({ brand }: { brand: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-navy p-8 text-white dark:border-slate-700 sm:p-10">
      <h2 className="text-2xl font-bold tracking-tight">Questions?</h2>
      <p className="mt-3 text-base text-slate-300">
        We&apos;re here if you need anything. Reach out any time — we respond
        quickly.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href="mailto:hello@majesticpermits.com"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-navy transition hover:bg-slate-100"
        >
          <Mail className="h-4 w-4" />
          Email us
        </a>
        <a
          href="tel:+13055550100"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Phone className="h-4 w-4" />
          Call
        </a>
        <a
          href="sms:+13055550100"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <MessageSquare className="h-4 w-4" />
          Text
        </a>
      </div>

      <p className="mt-6 text-sm text-slate-400">
        {brand} · South Florida
      </p>
    </div>
  );
}
