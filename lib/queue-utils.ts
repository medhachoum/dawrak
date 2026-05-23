import { prisma } from "@/lib/db";
import { QUEUE_ENTRY_STATUS } from "@/lib/constants";
import { toArabicDigits } from "@/lib/utils";

/**
 * Return Date (UTC instants) for the start (inclusive) and end (exclusive)
 * of the current day **in the given IANA timezone**.
 *
 * Example: getTodayRange("Asia/Riyadh") at 2026-05-22 23:30 UTC
 *          returns { start: 2026-05-22T21:00:00Z, end: 2026-05-23T21:00:00Z }
 *          (assuming Riyadh = UTC+3).
 *
 * Uses Intl.DateTimeFormat with `formatToParts` to avoid an extra dependency
 * and the offset edge cases of date-fns-tz on month boundaries.
 */
export function getTodayRange(
  timezone = "Asia/Riyadh",
  now: Date = new Date(),
): { start: Date; end: Date } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = fmt.formatToParts(now);
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? "0");

  const y = get("year");
  const m = get("month");
  const d = get("day");
  let h = get("hour");
  // Some runtimes report midnight as `24` rather than `0`; normalize.
  if (h === 24) h = 0;
  const mi = get("minute");
  const s = get("second");

  // The local-clock midnight equivalent in UTC is
  //   utcMidnight = now - elapsedSinceLocalMidnight
  const elapsedMs = ((h * 60 + mi) * 60 + s) * 1000;
  const start = new Date(
    Date.UTC(y, m - 1, d, 0, 0, 0) - 0, // base UTC at local Y-M-D 00:00
  );
  // start above is at UTC midnight of the SAME calendar Y-M-D as the local date,
  // which doesn't actually represent local midnight. Compute properly:
  const startInstant = new Date(now.getTime() - elapsedMs);
  void start;
  const endInstant = new Date(startInstant.getTime() + 24 * 60 * 60 * 1000);
  return { start: startInstant, end: endInstant };
}

/**
 * Hour-of-day (0..23) of a Date as observed in the given IANA timezone.
 */
export function hourInTimezone(date: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  return h === 24 ? 0 : h;
}

/**
 * Get the next sequential ticket number for a queue, scoped to today
 * **in the queue's business timezone**. Resets to 1 at local midnight.
 */
export async function getNextTicketNumber(
  queueId: string,
  timezone?: string,
): Promise<number> {
  let tz = timezone;
  if (!tz) {
    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      select: { business: { select: { timezone: true } } },
    });
    tz = queue?.business.timezone ?? "Asia/Riyadh";
  }
  const { start, end } = getTodayRange(tz);
  const last = await prisma.queueEntry.findFirst({
    where: {
      queueId,
      joinedAt: { gte: start, lt: end },
    },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });
  return (last?.ticketNumber ?? 0) + 1;
}

/**
 * Calculate 1-based position of an entry among currently waiting entries
 * in the same queue (ordered by ticketNumber). Returns 0 if not waiting.
 */
export async function calculatePosition(entryId: string): Promise<number> {
  const entry = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    select: { id: true, queueId: true, ticketNumber: true, status: true },
  });
  if (!entry) return 0;
  if (entry.status !== QUEUE_ENTRY_STATUS.waiting) return 0;

  const ahead = await prisma.queueEntry.count({
    where: {
      queueId: entry.queueId,
      status: QUEUE_ENTRY_STATUS.waiting,
      ticketNumber: { lt: entry.ticketNumber },
    },
  });
  return ahead + 1;
}

/**
 * Estimate wait time in minutes based on position (1-based) and avg service time.
 * Position 1 means the customer is next up, so they wait ~0 minutes.
 */
export function estimateWaitTime(
  position: number,
  avgServiceTime: number,
): number {
  if (position <= 1) return 0;
  return (position - 1) * avgServiceTime;
}

/**
 * Format a ticket for visible display (Arabic-Indic digits).
 * e.g. (7, "A") -> "A-٠٠٧"
 */
export function formatTicketDisplay(ticketNumber: number, prefix = "A"): string {
  const padded = ticketNumber.toString().padStart(3, "0");
  return `${prefix}-${toArabicDigits(padded)}`;
}

/* --------------------------------------------------------------------- */
/* Simple in-memory pub/sub for SSE broadcasting.                         */
/* For multi-instance deployments swap this for Redis pub/sub. The public */
/* surface (subscribeToQueue / publishQueueEvent) stays the same.         */
/* --------------------------------------------------------------------- */

export type QueueEventType =
  | "join"
  | "called"
  | "completed"
  | "noshow"
  | "reset"
  | "heartbeat";

export interface QueueEvent {
  type: QueueEventType;
  queueId: string;
  entryId?: string;
  ticketNumber?: number;
  at: string; // ISO timestamp
}

type Subscriber = (event: QueueEvent) => void;

// Use a module-scoped Map kept alive across hot reloads in dev.
const globalForBus = globalThis as unknown as {
  __dawrakQueueBus?: Map<string, Set<Subscriber>>;
};

const bus: Map<string, Set<Subscriber>> =
  globalForBus.__dawrakQueueBus ?? new Map();
if (!globalForBus.__dawrakQueueBus) {
  globalForBus.__dawrakQueueBus = bus;
}

export function subscribeToQueue(
  queueId: string,
  handler: Subscriber,
): () => void {
  let set = bus.get(queueId);
  if (!set) {
    set = new Set();
    bus.set(queueId, set);
  }
  set.add(handler);
  return () => {
    const current = bus.get(queueId);
    if (!current) return;
    current.delete(handler);
    if (current.size === 0) bus.delete(queueId);
  };
}

export function publishQueueEvent(event: QueueEvent): void {
  const set = bus.get(event.queueId);
  if (!set || set.size === 0) return;
  for (const handler of set) {
    try {
      handler(event);
    } catch {
      // Ignore subscriber errors; they should not break the publisher.
    }
  }
}
