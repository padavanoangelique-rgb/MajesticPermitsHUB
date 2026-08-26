"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contractors, setContractors] = useState<
    Array<{ id: string; name: string | null; company_name: string | null }>
  >([]);

  useEffect(() => {
    fetch("/api/admin/contractors")
      .then((r) => (r.ok ? r.json() : { contractors: [] }))
      .then((d) => setContractors(d.contractors || []))
      .catch(() => setContractors([]));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      client_type: formData.get("client_type") as string,
      contractor_id: (formData.get("contractor_id") as string) || null,
      brand: formData.get("brand") as string,
      property_address: formData.get("property_address") as string,
      homeowner_name: formData.get("homeowner_name") as string,
      homeowner_email: formData.get("homeowner_email") as string,
      homeowner_phone: formData.get("homeowner_phone") as string,
      trade_type: formData.get("trade_type") as string,
      permit_number: formData.get("permit_number") as string,
      permit_eta: (formData.get("permit_eta") as string) || null,
      stage: formData.get("stage") as string,
      sub_status: formData.get("sub_status") as string,
      next_step: formData.get("next_step") as string,
      notes: formData.get("notes") as string,
    };

    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create job");
      }

      router.push(`/admin/jobs/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create job");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-[#0B1F3F]">
            ← Back to jobs
          </Link>
          <p className="text-sm font-semibold text-[#0B1F3F] dark:text-white">New Job</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-[#0B1F3F] dark:text-white">Create new job</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Client type</label>
              <select name="client_type" required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#111827]">
                <option value="homeowner">Homeowner</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Brand</label>
              <select name="brand" required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#111827]">
                <option value="Majestic Permits">Majestic Permits</option>
                <option value="The Permit Closer">The Permit Closer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Assign to contractor</label>
            <select name="contractor_id" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#111827]">
              <option value="">Not assigned (homeowner-only job)</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name || c.name || c.id}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              Assigning a contractor makes this job show up in their dashboard.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Property address *</label>
            <input name="property_address" required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#111827]" placeholder="123 Main St, Miami, FL" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Homeowner name</label>
              <input name="homeowner_name" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#111827]" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Homeowner email</label>
              <input name="homeowner_email" type="email" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#111827]" />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone</label>
              <input name="homeowner_phone" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#111827]" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Trade type</label>
              <input name="trade_type" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#111827]" placeholder="Windows, Roofing, etc." />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Permit number</label>
              <input name="permit_number" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#111827]" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Permit ETA</label>
              <input name="permit_eta" type="date" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#111827]" />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Stage</label>
              <select name="stage" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#111827]">
                <option>Getting your project ready</option>
                <option>Submitted to the city</option>
                <option>Under review</option>
                <option>Corrections requested</option>
                <option>Approved — ready to build</option>
                <option>Inspections in progress</option>
                <option>Final inspection passed</option>
                <option>Permit closed — all done</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Sub status</label>
              <select name="sub_status" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#111827]">
                <option>Need to Submit</option>
                <option>In Review</option>
                <option>Approved</option>
                <option>Approved and Printed</option>
                <option>Complete</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Next step</label>
            <input name="next_step" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#111827]" placeholder="What happens next..." />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Notes (visible to homeowner)</label>
            <textarea name="notes" rows={3} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-[#111827]" />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#0B1F3F] py-3.5 text-sm font-semibold text-white hover:bg-[#152C56] disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create job + tracking link"}
          </button>
        </form>
      </main>
    </div>
  );
}
