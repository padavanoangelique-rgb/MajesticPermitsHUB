import Link from "next/link";
import { BrandMark } from "@/components/public/brand-mark";
import {
  PUBLIC_HELLO,
  PUBLIC_PHONE_DISPLAY,
  PUBLIC_PHONE_TEL,
} from "@/lib/mailboxes";

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-border bg-background py-12">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark />
            <span className="text-lg font-semibold text-primary">Majestic Permits</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Permit expediting for windows, doors, roofing, and renovations in
            Miami-Dade, Broward, and Palm Beach.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/areas" className="text-foreground hover:text-primary">
            Areas we serve
          </Link>
          <Link href="/permit-closer" className="text-foreground hover:text-primary">
            The Permit Closer
          </Link>
          <Link href="/blog" className="text-foreground hover:text-primary">
            Blog
          </Link>
          <Link href="/faq" className="text-foreground hover:text-primary">
            FAQ
          </Link>
          <Link href="/#work" className="text-foreground hover:text-primary">
            Work
          </Link>
          <Link href="/contact" className="text-foreground hover:text-primary">
            Contact
          </Link>
          <Link href="/#info" className="font-semibold text-primary">
            Request more info
          </Link>
        </nav>

        <div className="text-sm text-muted-foreground">
          <p>
            <a className="text-foreground hover:text-primary" href={`mailto:${PUBLIC_HELLO}`}>
              {PUBLIC_HELLO}
            </a>
          </p>
          <p className="mt-1">
            <a className="text-foreground hover:text-primary" href={`tel:${PUBLIC_PHONE_TEL}`}>
              {PUBLIC_PHONE_DISPLAY}
            </a>
          </p>
          <p className="mt-4">© {new Date().getFullYear()} Majestic Permits</p>
        </div>
      </div>
    </footer>
  );
}
