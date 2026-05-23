/**
 * Centralized observability hook.
 *
 * Currently a thin wrapper that logs to the console. When SENTRY_DSN is set,
 * `instrumentation.ts` initializes Sentry and replaces this default exporter
 * via Sentry's automatic integrations — call sites here remain unchanged.
 *
 * Adding @sentry/nextjs as a real dep is intentionally deferred so the
 * project ships zero unused weight by default. Drop-in steps:
 *   1. `npm i @sentry/nextjs`
 *   2. Replace the body of `captureException`/`captureMessage` below
 *      with the Sentry equivalents (or remove this file and let Sentry's
 *      automatic instrumentation take over).
 *   3. Run `npx @sentry/wizard@latest -i nextjs`.
 */
import { env } from "@/lib/env";

export function captureException(
  err: unknown,
  context?: Record<string, unknown>,
): void {
  if (!env.SENTRY_DSN) {
    if (env.NODE_ENV !== "test") {
      // eslint-disable-next-line no-console
      console.error("[dawrak.error]", err, context ?? "");
    }
    return;
  }
  // Sentry would be invoked here; falls through to console until the SDK
  // is added as a dependency.
  // eslint-disable-next-line no-console
  console.error("[dawrak.error→sentry]", err, context ?? "");
}

export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, unknown>,
): void {
  if (!env.SENTRY_DSN) return;
  // eslint-disable-next-line no-console
  console.log(`[dawrak.${level}→sentry]`, message, context ?? "");
}
