import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { format } from "date-fns";
import { UpdateStageForm } from "@/components/admin/update-stage-form";
import { SendQuoteForm } from "@/components/admin/send-quote-form";
import { HomeownerNoteForm } from "@/components/admin/homeowner-note-form";
import { AssignContractorForm } from "@/components/admin/assign-contractor-form";
import { JurisdictionForm } from "@/components/admin/jurisdiction-form";
import { PermitHeader } from "@/components/shared/permit-header";
import { InspectionSlotForm } from "@/components/admin/inspection-slot-form";
import { JobDocuments } from "@/components/admin/job-documents";
import { HomeownerShareControls } from "@/components/admin/homeowner-share-controls";
import { DeleteJobButton } from "@/components/admin/delete-job-button";
import { NeedMoreInfoForm } from "@/components/admin/need-more-info-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SITE_URL } from "@/lib/email";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: PageProps) {
  await requireAdmin();

  const supabase = createServiceClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!job) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Job not found</p>
      </div>
    );
  }

  const { data: link } = await supabase
    .from("homeowner_links")
    .select("token, enabled, expires_at, view_count, last_viewed_at, regenerated_at")
    .eq("job_id", job.id)
    .maybeSingle();

  const { data: contractors } = await supabase
    .from("contractors")
    .select("id, name, company_name, email")
    .order("company_name", { ascending: true });

  const assignedContractor = (contractors || []).find((c) => c.id === job.contractor_id);

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, amount, description, status, bill_to, paid_at, expires_at, approved_at, approved_by_name, declined_at, approval_token, created_at, version")
    .eq("job_id", job.id)
    .order("created_at", { ascending: false });

  const { data: inspections } = await supabase
    .from("job_inspections")
    .select(
      "id, slot, inspection_type, status, requested_date, scheduled_date, result_date, inspector_name, inspector_number, correction_notes, visible_to_homeowner"
    )
    .eq("job_id", job.id)
    .order("slot", { ascending: true });

  const { data: documents } = await supabase
    .from("job_documents")
    .select(
      "id, category, label, file_name, visible_to_homeowner, visible_to_contractor, created_at"
    )
    .eq("job_id", job.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
        <Section title="Assigned contractor">
          <AssignContractorForm
            jobId={job.id}
            currentContractorId={job.contractor_id ?? null}
            contractors={contractors || []}
          />
        </Section>
      </div>

      <header className="border-b border-border bg-card dark:border-border dark:bg-card">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary">
            ← All jobs
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-primary dark:text-primary">
          {job.property_address}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {job.homeowner_name} · {job.client_type} · {job.brand}
        </p>

        <div className="mt-6">
          <PermitHeader
            permitNumber={job.permit_number}
            submittedDate={job.submitted_date}
            permitEta={job.permit_eta}
          />
        </div>

        <Section title="Current status">
          <p className="text-lg font-medium text-primary dark:text-primary">
            {job.stage} · {job.sub_status}
          </p>
          {job.permit_eta && (
            <p className="mt-1 text-sm text-primary dark:text-primary">
              ETA: {format(new Date(job.permit_eta), "MMMM d, yyyy")}
            </p>
          )}
          <div className="mt-6">
            <UpdateStageForm
              jobId={job.id}
              currentStage={job.stage}
              currentSubStatus={job.sub_status}
            />
          </div>
        </Section>

        <Section title="Need more information">
          <NeedMoreInfoForm
            jobId={job.id}
            contractorEmail={assignedContractor?.email ?? null}
            contractorName={
              assignedContractor?.company_name || assignedContractor?.name || null
            }
          />
        </Section>

        <Section title="Jurisdiction & NOC">
          <JurisdictionForm
            jobId={job.id}
            permitNumber={job.permit_number ?? null}
            contractorEmail={assignedContractor?.email ?? null}
            documents={documents || []}
            initial={{
              jurisdiction: job.jurisdiction ?? null,
              building_dept_url: job.building_dept_url ?? null,
              noc_status: job.noc_status ?? null,
            }}
          />
        </Section>

        <Section title="Inspections (up to 3)">
          <div className="-mx-6 -mb-6 divide-y divide-border dark:divide-border">
            {(inspections || []).map((slot: any) => (
              <InspectionSlotForm
                key={slot.id}
                slot={slot}
                tradeType={job.trade_type}
              />
            ))}
          </div>
        </Section>

        <Section title="Details">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Next step</dt>
              <dd className="max-w-xs text-right font-medium">{job.next_step || "—"}</dd>
            </div>
            {job.notes && (
              <div>
                <dt className="text-muted-foreground">Internal notes (admin only)</dt>
                <dd className="mt-1 rounded-lg bg-secondary p-3 dark:bg-secondary">{job.notes}</dd>
              </div>
            )}
          </dl>
        </Section>

        <Section title="Documents">
          <JobDocuments jobId={job.id} documents={documents || []} />
        </Section>

        <Section title="Quotes & payments">
          {(quotes || []).length > 0 && (
            <ul className="mb-4 divide-y divide-border dark:divide-border">
              {(quotes || []).map((q: any) => (
                <li key={q.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-primary dark:text-primary">
                      ${Number(q.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {q.bill_to === "contractor" ? "Contractor" : "Homeowner"}
                        {q.version > 1 ? ` · v${q.version}` : ""}
                      </span>
                    </p>
                    {q.description && (
                      <p className="text-xs text-muted-foreground">{q.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={
                        q.paid_at || q.approved_at
                          ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-emerald-200 dark:bg-green-900/30 dark:text-green-300"
                          : q.declined_at
                          ? "rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : q.expires_at && new Date(q.expires_at) < new Date()
                          ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
                          : "rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground dark:bg-secondary dark:text-foreground"
                      }
                    >
                      {q.paid_at
                        ? "Paid"
                        : q.approved_at
                        ? `Approved${q.approved_by_name ? " · " + q.approved_by_name : ""}`
                        : q.declined_at
                        ? "Declined"
                        : q.expires_at && new Date(q.expires_at) < new Date()
                        ? "Expired"
                        : q.status}
                    </span>
                    {q.approval_token && !q.paid_at && (
                      <a
                        href={`/quote/${q.approval_token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-muted-foreground underline hover:text-foreground dark:text-muted-foreground"
                      >
                        Open approval page
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <SendQuoteForm jobId={job.id} hasContractor={Boolean(job.contractor_id)} />
        </Section>

        <Section title="Homeowner tracking link">
          <HomeownerShareControls
            jobId={job.id}
            siteUrl={SITE_URL}
            link={link ?? null}
          />
        </Section>

        <Section title="Homeowner-visible note">
          <HomeownerNoteForm jobId={job.id} initialValue={job.homeowner_note} />
        </Section>

        <section className="mt-6 rounded-2xl border border-red-800/40 bg-red-950/20 p-6 dark:border-red-900/40 dark:bg-red-950/20">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-red-200 dark:text-red-400">
            Danger zone
          </h2>
          <p className="mb-4 text-sm text-muted-foreground dark:text-muted-foreground">
            Permanently deletes this job and all of its documents, inspections,
            quotes, and homeowner links. There is no undo.
          </p>
          <DeleteJobButton
            jobId={job.id}
            propertyAddress={job.property_address}
          />
        </section>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 dark:border-border dark:bg-card">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
