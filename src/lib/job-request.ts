export const PENDING_REQUEST_SUB = "Pending approval";
export const DECLINED_REQUEST_SUB = "Request declined";

export function isPendingJobRequest(job: { sub_status?: string | null }) {
  return job.sub_status === PENDING_REQUEST_SUB;
}
