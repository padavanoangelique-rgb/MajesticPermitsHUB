import { Mail, Phone, MessageSquare } from "lucide-react";
import { PUBLIC_HELLO, PUBLIC_PHONE_TEL } from "@/lib/mailboxes";

export function ContactCard({
  brand,
  email,
  phone,
}: {
  brand: string;
  email?: string | null;
  phone?: string | null;
}) {
  const supplied = (email || "").trim();
  const mail =
    !supplied || supplied.toLowerCase().includes("request@")
      ? PUBLIC_HELLO
      : supplied;
  const tel = phone || PUBLIC_PHONE_TEL;
  const telHref = tel.startsWith("+") ? tel : `+1${tel.replace(/\D/g, "").slice(-10)}`;

  return (
    <div className="rounded-3xl bg-primary p-8 text-primary-foreground sm:p-10">
      <h2 className="text-2xl font-bold tracking-tight">Questions?</h2>
      <p className="mt-3 text-base leading-relaxed opacity-90">
        We're here if you need anything. Reach out any time — we respond
        quickly.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href={`mailto:${mail}`}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-background px-6 py-3.5 text-sm font-semibold text-foreground transition hover:opacity-90"
        >
          <Mail className="h-4 w-4" />
          Email us
        </a>
        <a
          href={`tel:${telHref}`}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-primary-foreground/40 px-6 py-3.5 text-sm font-semibold transition hover:bg-primary-foreground/10"
        >
          <Phone className="h-4 w-4" />
          Call
        </a>
        <a
          href={`sms:${telHref}`}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-primary-foreground/40 px-6 py-3.5 text-sm font-semibold transition hover:bg-primary-foreground/10"
        >
          <MessageSquare className="h-4 w-4" />
          Text
        </a>
      </div>

      <p className="mt-6 text-sm opacity-80">
        {brand} · {mail}
      </p>
    </div>
  );
}
