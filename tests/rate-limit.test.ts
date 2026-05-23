import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

const uniqKey = (): string => `t-${Math.random().toString(36).slice(2, 10)}`;

describe("rateLimit (token bucket)", () => {
  it("allows up to `capacity` calls in the window then blocks", () => {
    const key = uniqKey();
    const r1 = rateLimit(key, 3, 60_000);
    const r2 = rateLimit(key, 3, 60_000);
    const r3 = rateLimit(key, 3, 60_000);
    const r4 = rateLimit(key, 3, 60_000);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("decrements the remaining counter", () => {
    const key = uniqKey();
    const r1 = rateLimit(key, 5, 60_000);
    const r2 = rateLimit(key, 5, 60_000);
    expect(r1.remaining).toBe(4);
    expect(r2.remaining).toBe(3);
  });

  it("uses independent buckets per key", () => {
    const a = uniqKey();
    const b = uniqKey();
    rateLimit(a, 1, 60_000); // exhaust a
    const blockedA = rateLimit(a, 1, 60_000);
    const allowedB = rateLimit(b, 1, 60_000);
    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });

  it("returns a non-negative resetAt in the near future when blocked", () => {
    const key = uniqKey();
    rateLimit(key, 1, 60_000);
    const blocked = rateLimit(key, 1, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.resetAt).toBeGreaterThan(Date.now());
  });

  it("refills tokens after the window passes (synthetic delay)", async () => {
    const key = uniqKey();
    rateLimit(key, 2, 50);
    rateLimit(key, 2, 50);
    expect(rateLimit(key, 2, 50).allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 80));

    expect(rateLimit(key, 2, 50).allowed).toBe(true);
  });
});
