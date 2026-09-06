import Link from "next/link";
import { format } from "date-fns";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth-guard";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { JobRequestActions } from "@/components/admin/job-request-actions";

export const dynamic = "force-dynamic";

export default async function AdminJobRequestsPage() {
  await requireAdmin();
  const supabase = createServiceClient();

  const { data: requests } = await supabase
    .from("job_requests")
    .select(
      "id, property_address, homeowner_name, homeowner_email, homeowner_phone, trade_type, jurisdiction, notes, status, decline_reason, approved_job_id, created_at, contractor_id"
    )
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

  const { data: files } = await supabase
    .from("job_request_files")
    .select("id, request_id, storage_path, file_name");

  const filesByRequest = new Map<string, Array<{ name: string; url: string }>>();
  for (const file of files || []) {
    const { data } = await supabase.storage
      .from("job-documents")
      .createSignedUrl(file.storage_path, 60 * 60);
    const list = filesByRequest.get(file.request_id) || [];
    list.push({ name: file.file_name, url: data?.signedUrl || "" });
    filesByRequest.set(file.request_id, list);
  }

  const pending = (requests || []).filter((r) => r.status === "pending");
  const others = (requests || []).filter((r) => r.status !== "pending");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020202]">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#090909]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-slate-500 hover:text-[#156cdd]">
              ← Jobs
            </Link>
            <p className="text-sm font-semibold text-[#156cdd] dark:text-[#b6ff2a]">
              Job requests
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-[#156cdd] dark:text-[#b6ff2a]">
          Contractor job requests
        </h1>
        <p className="mt-1 text-slate-500">
          {pending.length} waiting. Approve to add the job and attach the documents.
        </p>

        <div className="mt-8 space-y-4">
          {pending.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#090909]">
              <p className="text-slate-500">No pending requests</p>
            </div>
          )}
          {pending.map((req) => {
            const contractor = contractorMap.get(req.contractor_id);
            const docs = filesByRequest.get(req.id) || [];
            return (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#090909]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-[#156cdd] dark:text-[#b6ff2a]">
                      {req.property_address}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {contractor?.name}
                      {req.trade_type ? ` · ${req.trade_type}` : ""}
                      {req.jurisdiction ? ` · ${req.jurisdiction}` : ""}
                      {" · "}
                      {format(new Date(req.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                    {req.homeowner_name && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        Homeowner: {req.homeowner_name}
                        {req.homeowner_phone ? ` · ${req.homeowner_phone}` : ""}
                        {req.homeowner_email ? ` · ${req.homeowner_email}` : ""}
                      </p>
                    )}
                    {req.notes && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{req.notes}</p>
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
                                className="text-[#156cdd] underline"
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
            <h2 className="text-lg font-semibold text-slate-500">Previous</h2>
            <div className="mt-4 space-y-3">
              {others.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-100 bg-white/60 px-5 py-4 text-sm dark:border-slate-800 dark:bg-[#090909]/60"
                >
                  <span className="font-medium">{req.property_address}</span>
                  <span className="mx-2 text-slate-400">·</span>
                  <span className="capitalize text-slate-500">{req.status}</span>
                  {req.approved_job_id && (
                    <>
                      <span className="mx-2 text-slate-400">·</span>
                      <Link href={`/admin/jobs/${req.approved_job_id}`} className="text-[#156cdd] underline">
                        Open job
                      </Link>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
