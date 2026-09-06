import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { NewJobRequestForm } from "@/components/contractor/new-job-request-form";

export const dynamic = "force-dynamic";

export default async function NewJobRequestPage() {
  const user = await requireUser("/dashboard/new");
  const contractor = await getContractorForUser(user);
  if (!contractor) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020202]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#090909]">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-[#156cdd]">
            ← All projects
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-[#156cdd] dark:text-white">Request a new job</h1>
        <p className="mt-1 text-sm text-slate-500">
          Send the address and up to 5 documents. Majestic reviews it before it appears in your projects.
        </p>
        <div className="mt-8">
          <NewJobRequestForm />
        </div>
      </main>
    </div>
  );
}
