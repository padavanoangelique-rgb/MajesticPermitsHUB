import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-background-dark">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-surface-dark">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-sm font-bold text-white">
              M
            </div>
            <span className="font-semibold text-navy dark:text-white">
              Contractor Portal
            </span>
          </div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-navy dark:hover:text-white"
          >
            Sign out
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-navy dark:text-white">
          Your projects
        </h1>
        <p className="mt-2 text-muted-foreground">
          All active jobs assigned to your account.
        </p>

        <div className="mt-10 rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-surface-dark">
          <p className="text-muted-foreground">
            Projects will appear here once they are assigned to your contractor
            account.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            (Full data binding will be connected after auth is wired.)
          </p>
        </div>
      </main>
    </div>
  );
}
