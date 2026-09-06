/** Dedicated Majestic inboxes. Create these as Zoho aliases on angelique@. */
export const MAILBOX = {
  requests: "request@majesticpermits.com",
  inspections: "inspections@majesticpermits.com",
  accounting: "accounting@majesticpermits.com",
  owner: "angelique@majesticpermits.com",
} as const;

export const FROM_REQUESTS = `Majestic Permits Requests <${MAILBOX.requests}>`;
export const FROM_INSPECTIONS = `Majestic Permits Inspections <${MAILBOX.inspections}>`;
export const FROM_ACCOUNTING = `Majestic Permits Accounting <${MAILBOX.accounting}>`;
