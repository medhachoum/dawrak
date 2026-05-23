import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { QUEUE_ENTRY_STATUS } from "@/lib/constants";
import {
  calculatePosition,
  estimateWaitTime,
  formatTicketDisplay,
  publishQueueEvent,
} from "@/lib/queue-utils";
import { assertSameOrigin } from "@/lib/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { queueId: string; entryId: string } },
) {
  try {
    const entry = await prisma.queueEntry.findUnique({
      where: { id: params.entryId },
      include: {
        queue: {
          select: {
            id: true,
            name: true,
            avgServiceTime: true,
            status: true,
          },
        },
      },
    });

    if (!entry || entry.queueId !== params.queueId) {
      return fail("التذكرة غير موجودة", 404);
    }

    // Heartbeat: keep the entry alive so the cleanup job doesn't mark it stale.
    if (entry.status === QUEUE_ENTRY_STATUS.waiting) {
      prisma.queueEntry
        .update({
          where: { id: entry.id },
          data: { lastSeenAt: new Date() },
        })
        .catch(() => {
          /* best-effort */
        });
    }

    const position = await calculatePosition(entry.id);
    const estimatedWaitMinutes = estimateWaitTime(
      position,
      entry.queue.avgServiceTime,
    );

    return ok({
      entry: {
        id: entry.id,
        queueId: entry.queueId,
        ticketNumber: entry.ticketNumber,
        ticketDisplay: formatTicketDisplay(entry.ticketNumber),
        customerName: entry.customerName,
        customerPhone: entry.customerPhone,
        status: entry.status,
        joinedAt: entry.joinedAt.toISOString(),
        calledAt: entry.calledAt?.toISOString() ?? null,
        completedAt: entry.completedAt?.toISOString() ?? null,
      },
      queue: entry.queue,
      position,
      estimatedWaitMinutes,
    });
  } catch (err) {
    return fail(`خطأ في الخادم: ${String(err)}`, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { queueId: string; entryId: string } },
) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  try {
    const entry = await prisma.queueEntry.findUnique({
      where: { id: params.entryId },
      select: { id: true, queueId: true, ticketNumber: true, status: true },
    });

    if (!entry || entry.queueId !== params.queueId) {
      return fail("التذكرة غير موجودة", 404);
    }

    if (
      entry.status === QUEUE_ENTRY_STATUS.completed ||
      entry.status === QUEUE_ENTRY_STATUS.noshow
    ) {
      return fail("لا يمكن مغادرة طابور مكتمل", 409);
    }

    await prisma.queueEntry.update({
      where: { id: entry.id },
      data: {
        status: QUEUE_ENTRY_STATUS.noshow,
        completedAt: new Date(),
      },
    });

    publishQueueEvent({
      type: "noshow",
      queueId: entry.queueId,
      entryId: entry.id,
      ticketNumber: entry.ticketNumber,
      at: new Date().toISOString(),
    });

    return ok({ ok: true });
  } catch (err) {
    return fail(`خطأ في الخادم: ${String(err)}`, 500);
  }
}
