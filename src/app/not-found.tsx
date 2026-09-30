import Link from "next/link";
import { PUBLIC_HELLO } from "@/lib/mailboxes";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-foreground">
          This link isn't valid
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The tracking link you used may have expired or been typed incorrectly.
          Email us and we will send a new one.
        </p>
        <a
          href={`mailto:${PUBLIC_HELLO}`}
          className="mt-8 inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          {PUBLIC_HELLO}
        </a>
        <p className="mt-4">
          <Link href="/" className="text-sm text-primary">
            Back to the site
          </Link>
        </p>
      </div>
    </div>
  );
}
