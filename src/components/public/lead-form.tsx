"use client";

import { useState } from "react";

export type InquiryIntent = "more-info" | "permit-report" | "contact";

const COPY: Record<
  InquiryIntent,
  { button: string; done: string; company?: boolean; address?: boolean; message?: boolean }
> = {
  "more-info": {
    button: "Register your company",
    done: "We have your email. We will write you about registration. A new permit is requested inside the hub after you are onboarded.",
    company: true,
  },
  "permit-report": {
    button: "Send me the free report",
    done: "We have your email. If this matches a letter we sent, we will reply with the free permit report.",
    address: true,
  },
  contact: {
    button: "Contact me",
    done: "We have your email. We will write back.",
    message: true,
  },
};

export function InquiryForm({ intent }: { intent: InquiryIntent }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const copy = COPY[intent];

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      intent,
      fullName: String(data.get("fullName") || ""),
      email: String(data.get("email") || ""),
      company: String(data.get("company") || ""),
      propertyAddress: String(data.get("propertyAddress") || ""),
      message: String(data.get("message") || ""),
      company_website: String(data.get("company_website") || ""),
    };

    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      setStatus("done");
      form.reset();
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Something went wrong.");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-3xl border border-border bg-card p-5">
        <h3 className="text-xl font-semibold">Got it.</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.done}</p>
        <button type="button" onClick={() => setStatus("idle")} className="mt-4 text-sm font-semibold text-accent">
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="grid gap-3">
        <label className="block text-sm font-medium">
          Name <span className="text-accent">*</span>
          <input name="fullName" required autoComplete="name" className={inputClass} />
        </label>
        <label className="block text-sm font-medium">
          Email <span className="text-accent">*</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        {copy.company && (
          <label className="block text-sm font-medium">
            Company
            <input name="company" autoComplete="organization" className={inputClass} placeholder="Optional" />
          </label>
        )}
        {copy.address && (
          <label className="block text-sm font-medium">
            Property address <span className="text-accent">*</span>
            <input name="propertyAddress" required autoComplete="street-address" className={inputClass} placeholder="The address on the letter" />
          </label>
        )}
        {copy.message && (
          <label className="block text-sm font-medium">
            What do you need
            <input name="message" className={inputClass} placeholder="One line is enough" />
          </label>
        )}
      </div>
      <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Company website
          <input name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {status === "error" && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : copy.button}
      </button>
    </form>
  );
}
