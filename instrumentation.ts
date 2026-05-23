/**
 * Next.js instrumentation hook — runs once per server process before any
 * request is served. Used here to wire Sentry conditionally without paying
 * the import cost when SENTRY_DSN is unset.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (!process.env.SENTRY_DSN) return;

  // The dynamic import keeps the @sentry/nextjs dep optional. To enable:
  //   1. npm i @sentry/nextjs
  //   2. Set SENTRY_DSN in env.
  //   3. (Optional) run `npx @sentry/wizard@latest -i nextjs` for client/edge.
  try {
    // @ts-expect-error — optional dep, only resolves once installed.
    const Sentry = await import("@sentry/nextjs");
    Sentry.init?.({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
    });
  } catch {
    // Optional dep not installed yet — that's fine; observability.ts
    // gracefully falls back to console.
  }
}
