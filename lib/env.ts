import { z } from "zod";

/**
 * Centralized, validated environment variables for Dawrak.
 *
 * Server-only secrets MUST NOT be prefixed with `NEXT_PUBLIC_`.
 * Anything safe to ship to the browser MUST be prefixed with `NEXT_PUBLIC_`.
 *
 * Validation runs at process start. Missing/invalid envs throw a readable
 * error with the offending field, instead of silently surfacing as
 * runtime crashes deep inside auth/db code.
 */

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (e.g. file:./dev.db or postgres://...)"),

  // Auth.js v5 secret. Generate with `npx auth secret` or `openssl rand -hex 32`.
  // Required in production; auto-generated dev fallback otherwise.
  AUTH_SECRET: z.string().min(16).optional(),

  // Optional cron token: external schedulers must send `?token=` matching this
  // to call /api/cron/* endpoints. If unset, cron endpoints are disabled.
  CRON_SECRET: z.string().min(16).optional(),

  // Optional Sentry DSN. When set, Sentry is initialized in instrumentation.ts.
  SENTRY_DSN: z.string().url().optional(),

  // Optional SMS provider config (Unifonic / Twilio). When unset, SMS is no-op.
  SMS_PROVIDER: z.enum(["none", "unifonic", "twilio", "log"]).default("none"),
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),
});

function format(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}

const isServer = typeof window === "undefined";

const _server = isServer ? serverSchema.safeParse(process.env) : null;
const _client = clientSchema.safeParse({
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
});

if (_server && !_server.success) {
  // eslint-disable-next-line no-console
  console.error(
    `❌ Invalid server environment variables:\n${format(_server.error)}`,
  );
  throw new Error("Invalid server environment variables");
}

if (!_client.success) {
  // eslint-disable-next-line no-console
  console.error(
    `❌ Invalid client environment variables:\n${format(_client.error)}`,
  );
  throw new Error("Invalid client environment variables");
}

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

const serverEnv = (_server?.data ?? {}) as Partial<ServerEnv>;
const clientEnv = _client.data;

export const env = {
  ...serverEnv,
  ...clientEnv,
} as ServerEnv & ClientEnv;

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
