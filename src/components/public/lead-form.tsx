"use client";

import { useState } from "react";
import { PUBLIC_FORM_BRANDS, PUBLIC_PROJECT_TYPES } from "@/lib/brands";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2";

export function LeadForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      fullName: String(data.get("fullName") || ""),
      phone: String(data.get("phone") || ""),
      email: String(data.get("email") || ""),
      propertyAddress: String(data.get("propertyAddress") || ""),
      projectType: String(data.get("projectType") || ""),
      brand: String(data.get("brand") || ""),
      notes: String(data.get("notes") || ""),
      company_website: String(data.get("company_website") || ""),
    };

    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Something went wrong.");
      }
      setStatus("done");
      form.reset();
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Something went wrong.");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-3xl border border-primary/30 bg-primary/5 p-8 sm:p-10">
        <h3 className="text-2xl font-semibold text-foreground">We have it.</h3>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Thanks. Your project is in our queue. We will reach you at the phone
          or email you entered. If you already work with us, this stays on that
          account — we do not open a second one.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-semibold text-primary"
        >
          Send another project
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Full name <span className="text-primary">*</span>
          <input name="fullName" required autoComplete="name" className={`mt-1.5 ${inputClass}`} />
        </label>
        <label className="block text-sm font-medium">
          Phone <span className="text-primary">*</span>
          <input name="phone" type="tel" required autoComplete="tel" className={`mt-1.5 ${inputClass}`} />
        </label>
        <label className="block text-sm font-medium">
          Email <span className="text-primary">*</span>
          <input name="email" type="email" required autoComplete="email" className={`mt-1.5 ${inputClass}`} />
        </label>
        <label className="block text-sm font-medium sm:col-span-2">
          Property address <span className="text-primary">*</span>
          <input name="propertyAddress" required autoComplete="street-address" className={`mt-1.5 ${inputClass}`} />
        </label>
        <label className="block text-sm font-medium">
          Project type <span className="text-primary">*</span>
          <select name="projectType" required className={`mt-1.5 ${inputClass}`} defaultValue="">
            <option value="" disabled>
              Select one
            </option>
            {PUBLIC_PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Brand <span className="text-primary">*</span>
          <select name="brand" required className={`mt-1.5 ${inputClass}`} defaultValue="Majestic Permits">
            {PUBLIC_FORM_BRANDS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium sm:col-span-2">
          Notes
          <textarea name="notes" rows={4} className={`mt-1.5 ${inputClass}`} placeholder="Optional. Scope, HOA, or an expired permit number." />
        </label>
      </div>

      <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Company website
          <input name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {status === "error" && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? "Sending…" : "Start your project"}
      </button>
    </form>
  );
}
