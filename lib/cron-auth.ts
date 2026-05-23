import { type NextRequest } from "next/server";
import { fail } from "@/lib/api-response";
import { env } from "@/lib/env";

/**
 * Verifies a cron-callable request.
 *
 * Accepts the secret in either:
 *  1. `Authorization: Bearer <CRON_SECRET>`  (Vercel Cron sends this automatically)
 *  2. `?token=<CRON_SECRET>`                  (simpler for ad-hoc external schedulers)
 *
 * Fail-closed: if `CRON_SECRET` is not configured, the route is disabled (503).
 *
 * Returns `null` when the request is authorized; otherwise a Response that
 * the caller should return immediately.
 */
export function assertCronAuthorized(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return fail("Cron disabled (set CRON_SECRET)", 503);
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ")) {
    const provided = auth.slice("Bearer ".length).trim();
    if (provided === env.CRON_SECRET) return null;
  }

  const token = new URL(req.url).searchParams.get("token");
  if (token === env.CRON_SECRET) return null;

  return fail("غير مصرّح", 401);
}
