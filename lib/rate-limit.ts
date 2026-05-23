/**
 * Lightweight in-memory rate limiter (token bucket per key).
 *
 * Use cases:
 *   - /api/queue/[id]/join   → throttle by IP
 *   - /api/auth/signup       → throttle by IP
 *   - /api/business/[slug]/qr → throttle by IP
 *
 * For multi-instance / serverless deployments, swap this implementation
 * for Upstash Redis (`@upstash/ratelimit`) without changing call sites.
 *
 * The bucket is stored on globalThis so HMR doesn't reset state in dev.
 */

interface Bucket {
  // Remaining tokens.
  tokens: number;
  // Time (ms epoch) the bucket was last refilled.
  refilledAt: number;
}

interface RateLimitGlobal {
  buckets: Map<string, Bucket>;
}

const g = globalThis as unknown as { __dawrakRateLimit?: RateLimitGlobal };
if (!g.__dawrakRateLimit) {
  g.__dawrakRateLimit = { buckets: new Map() };
}
const buckets = g.__dawrakRateLimit.buckets;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Allow up to `capacity` actions per `windowMs` for the given key.
 * Returns whether the call is allowed and how many tokens remain.
 */
export function rateLimit(
  key: string,
  capacity: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: capacity, refilledAt: now };
    buckets.set(key, bucket);
  }

  // Refill: linearly grant tokens proportional to elapsed time.
  const elapsed = now - bucket.refilledAt;
  if (elapsed > 0) {
    const refill = (elapsed / windowMs) * capacity;
    bucket.tokens = Math.min(capacity, bucket.tokens + refill);
    bucket.refilledAt = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      resetAt: now + windowMs,
    };
  }

  // Time until next token is available.
  const msPerToken = windowMs / capacity;
  return {
    allowed: false,
    remaining: 0,
    resetAt: now + Math.ceil((1 - bucket.tokens) * msPerToken),
  };
}

/**
 * Periodic cleanup so the Map doesn't grow unbounded with stale IPs.
 * Runs every 10 minutes. Safe to import without invoking explicitly.
 */
const g2 = globalThis as unknown as { __dawrakRateLimitCleanup?: NodeJS.Timeout };
if (!g2.__dawrakRateLimitCleanup) {
  g2.__dawrakRateLimitCleanup = setInterval(
    () => {
      const cutoff = Date.now() - 60 * 60 * 1000;
      for (const [key, bucket] of buckets.entries()) {
        if (bucket.refilledAt < cutoff) buckets.delete(key);
      }
    },
    10 * 60 * 1000,
  );
  // Don't keep the process alive just for cleanup.
  if (typeof g2.__dawrakRateLimitCleanup.unref === "function") {
    g2.__dawrakRateLimitCleanup.unref();
  }
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
