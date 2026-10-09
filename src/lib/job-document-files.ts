export const DOCUMENT_CATEGORIES = [
  { value: "intake", label: "Plans / intake" },
  { value: "submitted_package", label: "Submitted package" },
  { value: "corrections", label: "Corrections / revisions" },
  { value: "approved_permit", label: "Approved permit" },
  { value: "inspections", label: "Inspection documents / photos" },
  { value: "closeout", label: "Closeout documents" },
  { value: "other", label: "Other" },
];
// Each multipart request stays below the hosting platform's 4.5 MB limit.
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
export const DOCUMENT_ACCEPT = ".pdf,.png,.jpg,.jpeg,.heic,.webp,.doc,.docx,.xls,.xlsx,.zip";
export function documentFileError(file: { name: string; size: number }): string | null {
  if (!file.size) return `${file.name} is empty.`;
  if (file.size > MAX_DOCUMENT_BYTES) return `${file.name} is over 4 MB. Split or compress the file before uploading.`;
  if (!/\.(pdf|png|jpe?g|heic|webp|docx?|xlsx?|zip)$/i.test(file.name)) return `${file.name} is not a supported document or image.`;
  return null;
}
export function documentSource(path?: string | null): string {
  const source = path?.split("/")[1];
  if (source === "contractor") return "Contractor upload";
  if (source === "majestic") return "Majestic upload";
  return "Job document";
}
