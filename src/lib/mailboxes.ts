/** Dedicated Majestic inboxes. Create these as Zoho aliases on angelique@. */
export const MAILBOX = {
  requests: "request@majesticpermits.com",
  inspections: "inspections@majesticpermits.com",
  accounting: "accounting@majesticpermits.com",
  owner: "angelique@majesticpermits.com",
} as const;

/** Public address. Safe to print on the website. Never use as a FROM address. */
export const PUBLIC_HELLO = "hello@majesticpermits.com";

export const PUBLIC_PHONE_DISPLAY = "(561) 888-3805";
export const PUBLIC_PHONE_TEL = "+15618883805";

export const FROM_REQUESTS = `Majestic Permits Requests <${MAILBOX.requests}>`;
export const FROM_INSPECTIONS = `Majestic Permits Inspections <${MAILBOX.inspections}>`;
export const FROM_ACCOUNTING = `Majestic Permits Accounting <${MAILBOX.accounting}>`;
