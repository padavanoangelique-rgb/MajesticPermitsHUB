import Link from "next/link";
import { format } from "date-fns";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth-guard";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { JobRequestActions } from "@/components/admin/job-request-actions";
import { DECLINED_REQUEST_SUB, PENDING_REQUEST_SUB } from "@/lib/job-request";

export const dynamic = "force-dynamic";

export default async function AdminJobRequestsPage() {
  await requireAdmin();
  const supabase = createServiceClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, property_address, homeowner_name, homeowner_email, homeowner_phone, trade_type, jurisdiction, notes, sub_status, created_at, contractor_id"
    )
    .in("sub_status", [PENDING_REQUEST_SUB, DECLINED_REQUEST_SUB, "Need to Submit"])
    .order("created_at", { ascending: false });

  const { data: contractors } = await supabase
    .from("contractors")
    .select("id, name, company_name, email");
  const contractorMap = new Map(
    (contractors || []).map((c) => [
      c.id,
      { name: c.company_name || c.name || "Contractor", email: c.email || "" },
    ])
  );

  const pending = (jobs || []).filter((j) => j.sub_status === PENDING_REQUEST_SUB);
  const others = (jobs || []).filter((j) => j.sub_status !== PENDING_REQUEST_SUB);

  const pendingIds = pending.map((j) => j.id);
  const { data: files } =
    pendingIds.length > 0
      ? await supabase
          .from("job_documents")
          .select("job_id, file_name, storage_path")
          .in("job_id", pendingIds)
      : { data: [] as any[] };

  const filesByJob = new Map<string, Array<{ name: string; url: string }>>();
  for (const file of files || []) {
    const { data } = await supabase.storage
      .from("job-documents")
      .createSignedUrl(file.storage_path, 60 * 60);
    const list = filesByJob.get(file.job_id) || [];
    list.push({ name: file.file_name, url: data?.signedUrl || "" });
    filesByJob.set(file.job_id, list);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card dark:border-border dark:bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
              ← Jobs
            </Link>
            <p className="text-sm font-semibold text-primary dark:text-primary">
              Job requests
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-primary dark:text-primary">
          Contractor job requests
        </h1>
        <p className="mt-1 text-muted-foreground">
          {pending.length} waiting. Approve to add the job to the contractor dashboard.
        </p>

        <div className="mt-8 space-y-4">
          {pending.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center dark:border-border dark:bg-card">
              <p className="text-muted-foreground">No pending requests</p>
            </div>
          )}
          {pending.map((req) => {
            const contractor = contractorMap.get(req.contractor_id);
            const docs = filesByJob.get(req.id) || [];
            return (
              <div
                key={req.id}
                className="rounded-2xl border border-border bg-card p-6 dark:border-border dark:bg-card"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-primary dark:text-primary">
                      {req.property_address}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {contractor?.name}
                      {req.trade_type ? ` · ${req.trade_type}` : ""}
                      {req.jurisdiction ? ` · ${req.jurisdiction}` : ""}
                      {" · "}
                      {format(new Date(req.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                    {req.homeowner_name && (
                      <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
                        Homeowner: {req.homeowner_name}
                        {req.homeowner_phone ? ` · ${req.homeowner_phone}` : ""}
                        {req.homeowner_email ? ` · ${req.homeowner_email}` : ""}
                      </p>
                    )}
                    {req.notes && (
                      <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">{req.notes}</p>
                    )}
                    {docs.length > 0 && (
                      <ul className="mt-3 space-y-1 text-sm">
                        {docs.map((doc) => (
                          <li key={doc.name}>
                            {doc.url ? (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline"
                              >
                                {doc.name}
                              </a>
                            ) : (
                              doc.name
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <JobRequestActions id={req.id} />
                </div>
              </div>
            );
          })}
        </div>

        {others.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-muted-foreground">Previous</h2>
            <div className="mt-4 space-y-3">
              {others.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-border bg-card/80 px-5 py-4 text-sm dark:border-border dark:bg-card/60"
                >
                  <span className="font-medium">{req.property_address}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="capitalize text-muted-foreground">{req.sub_status}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <Link href={`/admin/jobs/${req.id}`} className="text-primary underline">
                    Open job
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
