import { describe, expect, it, vi } from "vitest";
import {
  estimateWaitTime,
  formatTicketDisplay,
  getTodayRange,
  hourInTimezone,
  publishQueueEvent,
  subscribeToQueue,
} from "@/lib/queue-utils";

// `getNextTicketNumber` and `calculatePosition` hit Prisma, so they are not
// covered here — they are integration-tested via the API E2E flow instead.

describe("formatTicketDisplay", () => {
  it("pads with leading zeros and uses Arabic-Indic digits", () => {
    expect(formatTicketDisplay(7)).toBe("A-٠٠٧");
    expect(formatTicketDisplay(42)).toBe("A-٠٤٢");
    expect(formatTicketDisplay(123)).toBe("A-١٢٣");
  });

  it("supports custom prefix", () => {
    expect(formatTicketDisplay(5, "B")).toBe("B-٠٠٥");
  });

  it("does not truncate numbers > 999", () => {
    expect(formatTicketDisplay(1000)).toBe("A-١٠٠٠");
  });
});

describe("estimateWaitTime", () => {
  it("returns 0 for the next-up customer", () => {
    expect(estimateWaitTime(1, 15)).toBe(0);
    expect(estimateWaitTime(0, 15)).toBe(0);
    expect(estimateWaitTime(-3, 15)).toBe(0);
  });

  it("scales linearly with position", () => {
    expect(estimateWaitTime(2, 10)).toBe(10);
    expect(estimateWaitTime(5, 10)).toBe(40);
  });

  it("respects the avg service time", () => {
    expect(estimateWaitTime(3, 7)).toBe(14);
    expect(estimateWaitTime(3, 0)).toBe(0);
  });
});

describe("hourInTimezone", () => {
  it("returns the wall-clock hour in the target tz", () => {
    // 2026-05-22T22:30:00Z is 2026-05-23 01:30 in Asia/Riyadh (+03)
    const d = new Date("2026-05-22T22:30:00Z");
    expect(hourInTimezone(d, "Asia/Riyadh")).toBe(1);
    expect(hourInTimezone(d, "UTC")).toBe(22);
  });

  it("handles dates that cross midnight in the local tz", () => {
    // 03:00 UTC == 06:00 in Asia/Riyadh
    const d = new Date("2026-01-15T03:00:00Z");
    expect(hourInTimezone(d, "Asia/Riyadh")).toBe(6);
  });
});

describe("getTodayRange", () => {
  it("returns a 24h window", () => {
    const { start, end } = getTodayRange("Asia/Riyadh");
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("anchors start at local midnight", () => {
    // Pretend `now` is 2026-05-22T15:00:00Z, which is 18:00 in Asia/Riyadh.
    // Local midnight is 2026-05-22T00:00 Riyadh = 2026-05-21T21:00 UTC.
    const now = new Date("2026-05-22T15:00:00Z");
    const { start } = getTodayRange("Asia/Riyadh", now);
    expect(start.toISOString()).toBe("2026-05-21T21:00:00.000Z");
  });

  it("works for UTC", () => {
    const now = new Date("2026-05-22T15:30:00Z");
    const { start, end } = getTodayRange("UTC", now);
    expect(start.toISOString()).toBe("2026-05-22T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-05-23T00:00:00.000Z");
  });

  it("contains the supplied `now`", () => {
    const now = new Date();
    const { start, end } = getTodayRange("Asia/Riyadh", now);
    expect(now.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(now.getTime()).toBeLessThan(end.getTime());
  });
});

describe("queue event bus", () => {
  it("delivers events to subscribers of the same queue", () => {
    const handler = vi.fn();
    const unsub = subscribeToQueue("q-1", handler);

    publishQueueEvent({
      type: "join",
      queueId: "q-1",
      entryId: "e-1",
      ticketNumber: 7,
      at: "2026-05-22T10:00:00.000Z",
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      type: "join",
      queueId: "q-1",
      ticketNumber: 7,
    });

    unsub();
  });

  it("does not deliver to subscribers of other queues", () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = subscribeToQueue("q-a", a);
    const unsubB = subscribeToQueue("q-b", b);

    publishQueueEvent({
      type: "called",
      queueId: "q-a",
      at: new Date().toISOString(),
    });

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();

    unsubA();
    unsubB();
  });

  it("removes the subscription when unsubscribe is called", () => {
    const h = vi.fn();
    const unsub = subscribeToQueue("q-x", h);
    unsub();
    publishQueueEvent({
      type: "join",
      queueId: "q-x",
      at: new Date().toISOString(),
    });
    expect(h).not.toHaveBeenCalled();
  });

  it("publishing to a queue with no subscribers is a no-op", () => {
    expect(() =>
      publishQueueEvent({
        type: "completed",
        queueId: "no-such-queue",
        at: new Date().toISOString(),
      }),
    ).not.toThrow();
  });

  it("isolates subscriber errors", () => {
    const bad = vi.fn(() => {
      throw new Error("boom");
    });
    const good = vi.fn();
    const unsubBad = subscribeToQueue("q-iso", bad);
    const unsubGood = subscribeToQueue("q-iso", good);

    expect(() =>
      publishQueueEvent({
        type: "join",
        queueId: "q-iso",
        at: new Date().toISOString(),
      }),
    ).not.toThrow();

    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalled();

    unsubBad();
    unsubGood();
  });
});
