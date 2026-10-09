"use client";
import { JobDocumentUpload } from "@/components/job-document-upload";
export function JobDocUpload({ jobId }: { jobId: string }) {
  return <JobDocumentUpload jobId={jobId} />;
}
