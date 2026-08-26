import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-light px-4 dark:bg-background-dark">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-navy dark:text-white">
          This link isn&apos;t valid
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          The tracking link you used may have expired or been typed incorrectly.
          Please contact Majestic Permits for a new link.
        </p>
        <a
          href="mailto:hello@majesticpermits.com"
          className="mt-8 inline-flex rounded-2xl bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-hover"
        >
          Email us
        </a>
      </div>
    </div>
  );
}
