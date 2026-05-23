import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-response";

/**
 * Origin / Referer check for state-changing requests.
 *
 * Auth.js handles its own CSRF for the auth endpoints. For any other
 * write endpoint (/join, /api/auth/signup, /api/dashboard/...) we require
 * the request to originate from our own host.
 *
 * Safe-list (skipped):
 *   - GET / HEAD / OPTIONS
 *   - same host
 *
 * Returns `null` when the request is allowed, or a NextResponse to send back.
 */
export function assertSameOrigin(request: Request): NextResponse | null {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // If neither origin nor referer is set we can't verify; in non-browser
  // contexts (server-to-server cron) prefer using a token-based check
  // (see /api/cron/* handlers). For browser POSTs both are set by spec.
  if (!origin && !referer) {
    return errorResponse("Origin غير صالح", 403);
  }

  const allowedHost = host.toLowerCase();

  if (origin) {
    try {
      const o = new URL(origin);
      if (o.host.toLowerCase() === allowedHost) return null;
    } catch {
      /* fallthrough */
    }
  }

  if (referer) {
    try {
      const r = new URL(referer);
      if (r.host.toLowerCase() === allowedHost) return null;
    } catch {
      /* fallthrough */
    }
  }

  return errorResponse("Origin غير مسموح", 403);
}
