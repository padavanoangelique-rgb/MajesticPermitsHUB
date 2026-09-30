"use client";

import { useState } from "react";
import { PUBLIC_FORM_BRANDS, PUBLIC_PROJECT_TYPES } from "@/lib/brands";

export function LeadForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const dark = tone === "dark";

  const inputClass = dark
    ? "mt-1.5 w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-base text-white outline-none ring-primary/40 placeholder:text-white/35 focus:ring-2"
    : "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2";

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
      <div className={dark ? "rounded-3xl border border-white/10 bg-card p-8" : "rounded-3xl border border-primary/30 bg-primary/5 p-8 sm:p-10"}>
        <h3 className={dark ? "text-2xl font-semibold text-white" : "text-2xl font-semibold text-foreground"}>We have it.</h3>
        <p className={dark ? "mt-3 text-base leading-relaxed text-white/70" : "mt-3 text-base leading-relaxed text-muted-foreground"}>
          Thanks. Your project is in our queue. We will reach you at the phone
          or email you entered. If you already work with us, this stays on that
          account — we do not open a second one.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-semibold text-accent"
        >
          Send another project
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        dark
          ? "relative rounded-3xl border border-white/10 bg-card p-6 sm:p-8"
          : "relative rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8"
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Full name <span className="text-accent">*</span>
          <input name="fullName" required autoComplete="name" className={inputClass} />
        </label>
        <label className="block text-sm font-medium">
          Phone <span className="text-accent">*</span>
          <input name="phone" type="tel" required autoComplete="tel" className={inputClass} />
        </label>
        <label className="block text-sm font-medium">
          Email <span className="text-accent">*</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="block text-sm font-medium sm:col-span-2">
          Property address <span className="text-accent">*</span>
          <input name="propertyAddress" required autoComplete="street-address" className={inputClass} />
        </label>
        <label className="block text-sm font-medium">
          Project type <span className="text-accent">*</span>
          <select name="projectType" required className={inputClass} defaultValue="">
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
          Brand <span className="text-accent">*</span>
          <select name="brand" required className={inputClass} defaultValue="Majestic Permits">
            {PUBLIC_FORM_BRANDS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium sm:col-span-2">
          Notes
          <textarea name="notes" rows={3} className={inputClass} placeholder="Optional. Scope, HOA, or an expired permit number." />
        </label>
      </div>

      <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Company website
          <input name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {status === "error" && (
        <p className="mt-4 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white transition hover:bg-primary disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Start your project"}
      </button>
    </form>
  );
}
