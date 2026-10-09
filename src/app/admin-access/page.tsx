import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { adminDestination } from "@/lib/admin-navigation";

export const dynamic = "force-dynamic";

export default async function AdminAccessPage({ searchParams }: {
  searchParams: { next?: string };
}) {
  const next = adminDestination(searchParams.next);
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (isAdminEmail(user.email)) redirect(next);
  const path = next.split("?")[0];
  const destination = path === "/admin/overview" ? "Overview" : path === "/admin" ? "Jobs" : "your owner workspace";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-primary">Majestic Permits · Owner workspace</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Sign in to open {destination}</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The Hub is currently signed in with a contractor account{user.email ? ` (${user.email})` : ""}.
          Sign in with your owner account to access the admin workspace.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Overview shows your operations summary and upcoming work. Jobs shows your full job list and permit controls.
        </p>
        <form action={`/auth/signout?next=${encodeURIComponent(next)}`} method="post" className="mt-6">
          <button className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Switch to owner account</button>
        </form>
        <a href="/dashboard" className="mt-4 block text-center text-sm text-muted-foreground underline">Open contractor dashboard</a>
      </section>
    </main>
  );
}
