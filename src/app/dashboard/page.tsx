import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { PERMIT_STAGES } from "@/lib/stages";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const supabase = createClient();

  const contractor = await getContractorForUser(user);

  // Friendly message when the auth user has no linked contractor row
  if (!contractor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-[#0A0F1C]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#0B1F3F] dark:text-white">
            Account not linked
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Your login works, but it is not yet linked to a contractor profile.
            Please contact Majestic Permits so we can connect your account.
          </p>
          <form action="/auth/signout" method="post" className="mt-8">
            <button className="text-sm text-slate-500 underline">
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, property_address, stage, sub_status, permit_number, permit_eta, submitted_date, updated_at"
    )
    .eq("contractor_id", contractor.id)
    .order("updated_at", { ascending: false });

  // Group jobs by canonical stage title. Any free-text stage that doesn't
  // match a PERMIT_STAGES title lands in "Other" so nothing is dropped.
  const grouped = new Map<string, any[]>();
  for (const stage of PERMIT_STAGES) grouped.set(stage.title, []);
  const other: any[] = [];
  for (const job of jobs || []) {
    const bucket = grouped.get(job.stage);
    if (bucket) bucket.push(job);
    else other.push(job);
  }

  const totalJobs = jobs?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0F1C]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-512.png"
              alt="Majestic Permits"
              width={36}
              height={36}
              priority
              className="rounded-lg"
            />
            <div>
              <p className="text-sm font-semibold text-[#0B1F3F] dark:text-white">
                {contractor.company_name || contractor.name}
              </p>
              <p className="text-xs text-slate-500">Contractor Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <button className="text-sm text-slate-500 hover:text-[#0B1F3F]">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3F] dark:text-white">
            Your Projects
          </h1>
          <p className="mt-1 text-slate-500">
            {totalJobs} active project{totalJobs !== 1 ? "s" : ""}
          </p>
        </div>

        {totalJobs === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#111827]">
            <p className="font-medium text-[#0B1F3F] dark:text-white">
              No projects assigned yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              As soon as Majestic Permits assigns a permit to your company, it
              will appear here with live status and inspection updates.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {PERMIT_STAGES.map((stage) => {
              const items = grouped.get(stage.title) ?? [];
              if (items.length === 0) return null;
              return (
                <StageSection
                  key={stage.key}
                  title={stage.title}
                  short={stage.short}
                  items={items}
                />
              );
            })}
            {other.length > 0 && (
              <StageSection
                title="Other"
                short="Other"
                items={other}
                accent="amber"
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StageSection({
  title,
  short,
  items,
  accent = "blue",
}: {
  title: string;
  short: string;
  items: any[];
  accent?: "blue" | "amber";
}) {
  const accentRing =
    accent === "amber"
      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
      : "bg-[#0B1F3F]/10 text-[#0B1F3F] dark:bg-[#C9A24B]/15 dark:text-[#C9A24B]";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#111827]">
      <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
        <span
          className={
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider " +
            accentRing
          }
        >
          {short}
        </span>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {title}
        </p>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {items.length}
        </span>
      </header>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((job) => (
          <li key={job.id}>
            <Link
              href={`/dashboard/projects/${job.id}`}
              className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#0B1F3F] dark:text-white">
                  {job.property_address}
                </p>
                {job.sub_status && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {job.sub_status}
                  </p>
                )}
              </div>
              <div className="hidden text-xs text-slate-500 sm:block">
                {job.permit_number ? (
                  <>
                    <span className="text-slate-400">Permit</span>{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {job.permit_number}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400">No permit #</span>
                )}
              </div>
              <div className="text-right text-xs text-slate-500">
                {job.permit_eta ? (
                  <>
                    <span className="text-slate-400">ETA</span>{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {format(new Date(job.permit_eta), "MMM d, yyyy")}
                    </span>
                  </>
                ) : job.updated_at ? (
                  <>
                    <span className="text-slate-400">Updated</span>{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {format(new Date(job.updated_at), "MMM d")}
                    </span>
                  </>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
