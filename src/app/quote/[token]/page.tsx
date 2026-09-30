import { createServiceClient } from "@/lib/supabase/service";
import { QuoteActions } from "@/components/quote/quote-actions";
import { format } from "date-fns";

interface PageProps {
  params: { token: string };
}

export const dynamic = "force-dynamic";

const BILL_TO_LABEL: Record<string, string> = {
  contractor: "Contractor",
  homeowner: "Homeowner",
};

export default async function QuoteApprovalPage({ params }: PageProps) {
  const supabase = createServiceClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select(
      "id, amount, description, status, bill_to, approval_token, approved_at, approved_by_name, declined_at, expires_at, paid_at, created_at, version, job_id"
    )
    .eq("approval_token", params.token)
    .maybeSingle();

  if (!quote) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold text-primary">
          Quote not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          This approval link is invalid or has been revoked. Please contact the
          Majestic Permits team if you believe this is a mistake.
        </p>
      </main>
    );
  }

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, brand, property_address, permit_number, submitted_date, permit_eta, homeowner_name"
    )
    .eq("id", quote.job_id)
    .maybeSingle();

  const isExpired =
    quote.expires_at && new Date(quote.expires_at) < new Date();
  const isApproved = Boolean(quote.approved_at);
  const isDeclined = Boolean(quote.declined_at);
  const isPaid = Boolean(quote.paid_at);
  const isFinal = isApproved || isDeclined || isPaid;

  const amountFormatted = Number(quote.amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm dark:border-border dark:bg-background">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {job?.brand || "Majestic Permits"} · Quote for review
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-primary dark:text-white">
          ${amountFormatted}
        </h1>
        {quote.description && (
          <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
            {quote.description}
          </p>
        )}

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Billed to
            </dt>
            <dd className="mt-0.5 font-medium text-foreground dark:text-foreground">
              {BILL_TO_LABEL[quote.bill_to] || "Homeowner"}
            </dd>
          </div>
          {job?.property_address && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Property
              </dt>
              <dd className="mt-0.5 font-medium text-foreground dark:text-foreground">
                {job.property_address}
              </dd>
            </div>
          )}
          {job?.permit_number && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Permit #
              </dt>
              <dd className="mt-0.5 font-medium text-foreground dark:text-foreground">
                {job.permit_number}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Issued
            </dt>
            <dd className="mt-0.5 font-medium text-foreground dark:text-foreground">
              {format(new Date(quote.created_at), "MMMM d, yyyy")}
            </dd>
          </div>
          {quote.expires_at && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Expires
              </dt>
              <dd
                className={`mt-0.5 font-medium ${
                  isExpired
                    ? "text-red-200 dark:text-red-400"
                    : "text-foreground dark:text-foreground"
                }`}
              >
                {format(new Date(quote.expires_at), "MMMM d, yyyy")}
                {isExpired ? " (expired)" : ""}
              </dd>
            </div>
          )}
          {quote.version > 1 && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Version
              </dt>
              <dd className="mt-0.5 font-medium text-foreground dark:text-foreground">
                v{quote.version}
              </dd>
            </div>
          )}
        </dl>

        {isPaid && (
          <div className="mt-8 rounded-xl bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200 dark:bg-green-900/20 dark:text-green-300">
            <p className="font-semibold">Paid</p>
            <p>This quote has already been paid. Thank you.</p>
          </div>
        )}

        {!isPaid && isApproved && (
          <div className="mt-8 rounded-xl bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200 dark:bg-green-900/20 dark:text-green-300">
            <p className="font-semibold">
              Approved{quote.approved_by_name ? ` by ${quote.approved_by_name}` : ""}
            </p>
            <p>
              {quote.approved_at &&
                `Approved on ${format(
                  new Date(quote.approved_at),
                  "MMMM d, yyyy"
                )}.`}{" "}
              We'll be in touch with next steps.
            </p>
          </div>
        )}

        {!isPaid && !isApproved && isDeclined && (
          <div className="mt-8 rounded-xl bg-secondary px-4 py-3 text-sm text-foreground dark:bg-secondary dark:text-foreground">
            <p className="font-semibold">Declined</p>
            <p>
              This quote was declined
              {quote.declined_at
                ? ` on ${format(new Date(quote.declined_at), "MMMM d, yyyy")}`
                : ""}
              . Reach out if you'd like us to revise it.
            </p>
          </div>
        )}

        {!isFinal && isExpired && (
          <div className="mt-8 rounded-xl bg-amber-950/30 px-4 py-3 text-sm text-amber-200 dark:bg-amber-900/20 dark:text-amber-300">
            <p className="font-semibold">This quote has expired</p>
            <p>Contact us to have a new quote issued.</p>
          </div>
        )}

        {!isFinal && !isExpired && (
          <QuoteActions token={params.token} billTo={quote.bill_to} />
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Majestic Permits · questions? Reply to the email that sent you this
        link.
      </p>
    </main>
  );
}
