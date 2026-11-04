import { requireUser } from "@/lib/auth-guard";
import { getContractorForUser } from "@/lib/contractor";
import { createServiceClient } from "@/lib/supabase/service";
import { ToolPage } from "@/components/contractor/tool-nav";
import { CompanyDocs, type CompanyDoc, type SentEmail } from "@/components/contractor/company-docs";
import { docTypeLabel, expiryStatus, expiryText } from "@/lib/company-docs";

export const dynamic = "force-dynamic";

export default async function CompanyPage() {
  const user = await requireUser("/dashboard/company");
  const contractor = await getContractorForUser(user);
  if (!contractor) return <p className="p-6">Account not linked.</p>;
  if (!contractor.company_id) return <p className="p-6">Your company is not set up yet. Contact Majestic Permits.</p>;

  const service = createServiceClient();
  const [{ data: docs }, { data: emails }] = await Promise.all([
    service
      .from("contractor_documents")
      .select("id, doc_type, label, doc_number, expires_on, file_name, size_bytes")
      .eq("company_id", contractor.company_id)
      .order("doc_type")
      .order("created_at", { ascending: false }),
    service
      .from("contractor_doc_emails")
      .select("id, ref_code, department, to_email, status, sent_at, replied_at, last_reply, document_ids")
      .eq("company_id", contractor.company_id)
      .order("sent_at", { ascending: false })
      .limit(25),
  ]);

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
  const docList = (docs || []) as CompanyDoc[];
  const flagged = docList
    .map((doc) => ({ doc, status: expiryStatus(doc.expires_on, today) }))
    .filter((x) => x.status.state === "expired" || x.status.state === "soon");

  return (
    <ToolPage
      current="/dashboard/company"
      title="License and insurance"
      lede="Keep the company's license, insurance and other documents here, each with its own expiration date. Anything expired, or inside 30 days, is flagged. Email the documents to a building department from this page."
    >
      <ul className="mb-4 grid gap-2 text-sm">
        {flagged.map(({ doc, status }) => (
          <li key={doc.id} className={"rounded-xl px-3 py-2 " + (status.state === "expired" ? "bg-rose-950/40 text-rose-200" : "bg-amber-950/40 text-amber-200")}>
            {doc.label || docTypeLabel(doc.doc_type)}: {expiryText(status.state, status.days)}
          </li>
        ))}
      </ul>
      <CompanyDocs
        companyName={contractor.company_name || contractor.name || "Contractor"}
        docs={docList}
        emails={((emails || []) as any[]).map((mail) => ({ ...mail, document_count: Array.isArray(mail.document_ids) ? mail.document_ids.length : 0 })) as SentEmail[]}
        today={today}
      />
    </ToolPage>
  );
}
