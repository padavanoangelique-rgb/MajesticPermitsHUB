import Link from "next/link";
import { Home, Mail, LogIn } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-light px-4 dark:bg-background-dark">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold text-navy dark:text-white sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          We couldn&apos;t find that page. If you followed a tracking link that
          may have expired, please contact Majestic Permits for a new one.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-hover"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-white dark:hover:bg-slate-800"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50 dark:border-slate-600 dark:bg-transparent dark:text-white dark:hover:bg-slate-800"
          >
            <Mail className="h-4 w-4" />
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
