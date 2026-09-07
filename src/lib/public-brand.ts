export function isPermitCloserJob(job: {
  brand?: string | null;
  client_type?: string | null;
}) {
  const brand = (job.brand || "").toLowerCase();
  if (brand.includes("closer")) return true;
  return job.client_type === "homeowner";
}

export function publicTrackBrand(
  job: { brand?: string | null; client_type?: string | null },
  contractor?: { company_name?: string | null; name?: string | null } | null
) {
  if (isPermitCloserJob(job)) return "Majestic Permits";
  return (
    contractor?.company_name ||
    contractor?.name ||
    (job.brand && job.brand !== "Majestic Permits" ? job.brand : "") ||
    "Majestic Permits"
  );
}
