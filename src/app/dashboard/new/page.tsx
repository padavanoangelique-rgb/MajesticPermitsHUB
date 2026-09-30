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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card dark:border-border dark:bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">
            ← All projects
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-primary dark:text-white">Request a new job</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send the address and up to 5 documents. Majestic reviews it before it appears in your projects.
        </p>
        <div className="mt-8">
          <NewJobRequestForm />
        </div>
      </main>
    </div>
  );
}
