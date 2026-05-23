import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api-response";
import { QUEUE_ENTRY_STATUS } from "@/lib/constants";
import { publishQueueEvent } from "@/lib/queue-utils";
import { assertCronAuthorized } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron-callable endpoint that marks stale `waiting` entries as `noshow`.
 *
 * Entry is considered stale when its `lastSeenAt` (heartbeat from the
 * customer's wait page) is older than `(avgServiceTime * (position + 5))`
 * minutes — generous enough to absorb network blips, strict enough to
 * unblock the queue.
 *
 * Authorization: `Authorization: Bearer $CRON_SECRET` (Vercel Cron)
 *             OR `?token=$CRON_SECRET` (other schedulers).
 * If `CRON_SECRET` is unset the route is disabled (503).
 *
 * Recommended schedule: every 5 minutes.
 */
export async function POST(req: NextRequest) {
  const denied = assertCronAuthorized(req);
  if (denied) return denied;
  return runCleanup();
}

/**
 * Allow GET for ad-hoc manual checks (still token-protected).
 * Vercel Cron uses GET as well, so this is the path it actually hits.
 */
export async function GET(req: NextRequest) {
  const denied = assertCronAuthorized(req);
  if (denied) return denied;
  return runCleanup();
}

async function runCleanup(): Promise<NextResponse> {
  const now = new Date();
  // Cap how far back we'll bother looking, so a one-time bug can't sweep up
  // pre-existing legitimate entries: only entries joined within the last 24h.
  const horizon = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const candidates = await prisma.queueEntry.findMany({
    where: {
      status: QUEUE_ENTRY_STATUS.waiting,
      joinedAt: { gte: horizon },
    },
    select: {
      id: true,
      queueId: true,
      ticketNumber: true,
      lastSeenAt: true,
      queue: { select: { avgServiceTime: true } },
    },
  });

  // Group candidates by queue to compute per-queue position cheaply.
  const byQueue = new Map<string, typeof candidates>();
  for (const c of candidates) {
    const arr = byQueue.get(c.queueId) ?? [];
    arr.push(c);
    byQueue.set(c.queueId, arr);
  }

  const stale: { id: string; queueId: string; ticketNumber: number }[] = [];

  for (const [, list] of byQueue) {
    list.sort((a, b) => a.ticketNumber - b.ticketNumber);
    list.forEach((entry, index) => {
      const position = index + 1;
      const avg = entry.queue.avgServiceTime || 15;
      const graceMinutes = avg * (position + 5);
      const cutoff = now.getTime() - graceMinutes * 60_000;
      if (entry.lastSeenAt.getTime() < cutoff) {
        stale.push({
          id: entry.id,
          queueId: entry.queueId,
          ticketNumber: entry.ticketNumber,
        });
      }
    });
  }

  if (stale.length === 0) {
    return ok({ swept: 0 });
  }

  await prisma.queueEntry.updateMany({
    where: { id: { in: stale.map((s) => s.id) } },
    data: { status: QUEUE_ENTRY_STATUS.noshow, completedAt: now },
  });

  for (const s of stale) {
    publishQueueEvent({
      type: "noshow",
      queueId: s.queueId,
      entryId: s.id,
      ticketNumber: s.ticketNumber,
      at: now.toISOString(),
    });
  }

  return ok({ swept: stale.length });
}
