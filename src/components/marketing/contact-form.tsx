"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

type Intent = "quote" | "access" | "general";

interface ContactFormProps {
  intent?: Intent;
  submitLabel?: string;
  showRole?: boolean;
  showProjectFields?: boolean;
}

export function ContactForm({
  intent = "quote",
  submitLabel = "Send request",
  showRole = true,
  showProjectFields = true,
}: ContactFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      company: String(form.get("company") || "").trim(),
      role: (form.get("role") as string) || undefined,
      project_type: String(form.get("project_type") || "").trim(),
      address: String(form.get("address") || "").trim(),
      message: String(form.get("message") || "").trim(),
      intent,
      website: String(form.get("website") || ""), // honeypot
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setError(
        "We couldn't reach the server. Please try again or email hello@majesticpermits.com."
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-900/40 dark:bg-green-950/20">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
        <h3 className="mt-4 text-xl font-semibold text-navy dark:text-white">
          Thanks — we&apos;ve got it
        </h3>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Someone from Majestic Permits will follow up shortly. If it&apos;s urgent,
          call{" "}
          <a
            href="tel:+15618883805"
            className="font-medium text-navy underline dark:text-gold"
          >
            (561) 888-3805
          </a>
          .
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-gold dark:focus:ring-gold/30";
  const labelClass =
    "mb-1.5 block text-sm font-medium text-navy dark:text-white";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-surface-dark sm:p-8"
    >
      {/* Honeypot: hidden from users, visible to bots */}
      <div className="hidden" aria-hidden="true">
        <label>
          Do not fill this field
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            className={inputClass}
            placeholder="Jane Contractor"
          />
        </div>
        <div>
          <label htmlFor="company" className={labelClass}>
            Company
          </label>
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            className={inputClass}
            placeholder="Smith Construction LLC"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={inputClass}
            placeholder="(555) 555-5555"
          />
        </div>
      </div>

      {showRole && (
        <div>
          <label htmlFor="role" className={labelClass}>
            I am a...
          </label>
          <select id="role" name="role" className={inputClass} defaultValue="contractor">
            <option value="contractor">Contractor</option>
            <option value="homeowner">Homeowner</option>
            <option value="other">Other</option>
          </select>
        </div>
      )}

      {showProjectFields && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="project_type" className={labelClass}>
              Project type
            </label>
            <select
              id="project_type"
              name="project_type"
              className={inputClass}
              defaultValue=""
            >
              <option value="">Select one…</option>
              <option value="Windows">Windows</option>
              <option value="Doors">Doors</option>
              <option value="Roofing">Roofing</option>
              <option value="Renovation">Renovation</option>
              <option value="New construction">New construction</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="address" className={labelClass}>
              Property address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              autoComplete="street-address"
              className={inputClass}
              placeholder="1234 Main St, Miami FL"
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="message" className={labelClass}>
          Tell us about your project{" "}
          <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={5}
          rows={5}
          className={inputClass}
          placeholder="Scope, timing, jurisdiction — anything helpful."
        />
      </div>

      {status === "error" && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-navy px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-hover disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Sending…" : submitLabel}
      </button>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        By submitting, you agree that Majestic Permits may contact you about
        your project. We never share your info.
      </p>
    </form>
  );
}
