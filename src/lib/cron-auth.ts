/**
 * Cron endpoints are public URLs, so they must authenticate the caller.
 *
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when
 * a CRON_SECRET env var exists, and also sets an `x-vercel-cron` header.
 * Either one is accepted so you can also trigger a run manually with the secret.
 */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  if (secret && auth === `Bearer ${secret}`) return true;
  if (req.headers.get("x-vercel-cron")) return true;

  // No secret configured at all: allow Vercel's own invocations only.
  return false;
}
