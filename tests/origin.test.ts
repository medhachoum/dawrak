import { describe, expect, it } from "vitest";
import { assertSameOrigin } from "@/lib/origin";

function makeReq(
  method: string,
  url: string,
  headers: Record<string, string> = {},
): Request {
  return new Request(url, { method, headers });
}

describe("assertSameOrigin", () => {
  const HOST = "dawrak.example";
  const URL_BASE = `https://${HOST}/api/queue/q-1/join`;

  it("allows safe methods regardless of origin", () => {
    const r = makeReq("GET", URL_BASE);
    expect(assertSameOrigin(r)).toBeNull();
  });

  it("blocks state-changing requests with no origin/referer", () => {
    const r = makeReq("POST", URL_BASE, { host: HOST });
    const out = assertSameOrigin(r);
    expect(out).not.toBeNull();
    expect(out?.status).toBe(403);
  });

  it("allows when origin matches host", () => {
    const r = makeReq("POST", URL_BASE, {
      host: HOST,
      origin: `https://${HOST}`,
    });
    expect(assertSameOrigin(r)).toBeNull();
  });

  it("allows when referer matches host", () => {
    const r = makeReq("POST", URL_BASE, {
      host: HOST,
      referer: `https://${HOST}/q/some-page`,
    });
    expect(assertSameOrigin(r)).toBeNull();
  });

  it("blocks when origin host is different", () => {
    const r = makeReq("POST", URL_BASE, {
      host: HOST,
      origin: "https://attacker.example",
    });
    const out = assertSameOrigin(r);
    expect(out?.status).toBe(403);
  });

  it("ignores invalid origin headers gracefully", () => {
    const r = makeReq("POST", URL_BASE, {
      host: HOST,
      origin: "not-a-url",
      referer: `https://${HOST}/q`,
    });
    // referer is valid → allowed
    expect(assertSameOrigin(r)).toBeNull();
  });

  it("blocks when neither header parses", () => {
    const r = makeReq("POST", URL_BASE, {
      host: HOST,
      origin: "garbage",
      referer: "also-garbage",
    });
    expect(assertSameOrigin(r)?.status).toBe(403);
  });

  it("is case-insensitive for host comparison", () => {
    const r = makeReq("POST", URL_BASE, {
      host: HOST.toUpperCase(),
      origin: `https://${HOST}`,
    });
    expect(assertSameOrigin(r)).toBeNull();
  });
});
