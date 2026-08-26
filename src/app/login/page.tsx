import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-light px-4 dark:bg-background-dark">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-700 dark:bg-surface-dark">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-lg font-bold text-white">
            M
          </div>
          <h1 className="mt-4 text-2xl font-bold text-navy dark:text-white">
            Client Login
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            For contractors with an active account
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy dark:text-white">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 dark:border-slate-600 dark:bg-background-dark"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy dark:text-white">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 dark:border-slate-600 dark:bg-background-dark"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white transition hover:bg-navy-hover"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Need an account?{" "}
          <a href="mailto:hello@majesticpermits.com" className="text-navy underline dark:text-gold">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
