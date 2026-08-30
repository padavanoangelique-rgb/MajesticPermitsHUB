import Link from "next/link";

export function SiteFooter() {
  return (
    <footer
      id="contact-footer"
      className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-background-dark"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-sm font-bold text-white">
                M
              </div>
              <span className="text-lg font-semibold text-navy dark:text-white">
                Majestic Permits
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              White-glove permitting for South Florida contractors and
              homeowners.
            </p>
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400">
            <p>
              <a
                href="mailto:hello@majesticpermits.com"
                className="hover:text-navy dark:hover:text-white"
              >
                hello@majesticpermits.com
              </a>
            </p>
            <p className="mt-1">
              <a
                href="tel:+15618883805"
                className="hover:text-navy dark:hover:text-white"
              >
                (561) 888-3805
              </a>
            </p>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link href="/contact" className="hover:text-navy dark:hover:text-white">
                Contact
              </Link>
              <Link
                href="/request-access"
                className="hover:text-navy dark:hover:text-white"
              >
                Request access
              </Link>
              <Link href="/login" className="hover:text-navy dark:hover:text-white">
                Client login
              </Link>
            </p>
            <p className="mt-4">
              © {new Date().getFullYear()} Majestic Permits
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
