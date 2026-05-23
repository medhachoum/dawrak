import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { QUEUE_ENTRY_STATUS } from "@/lib/constants";
import { estimateWaitTime, formatTicketDisplay } from "@/lib/queue-utils";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { queueId: string } },
) {
  try {
    const queue = await prisma.queue.findUnique({
      where: { id: params.queueId },
      include: {
        business: {
          select: { id: true, name: true, nameAr: true, slug: true },
        },
      },
    });
    if (!queue) {
      return fail("الطابور غير موجود", 404);
    }

    // "Current serving" = entry currently being served, else most recently called.
    const serving = await prisma.queueEntry.findFirst({
      where: {
        queueId: queue.id,
        status: QUEUE_ENTRY_STATUS.serving,
      },
      orderBy: { calledAt: "desc" },
    });

    const called = serving
      ? null
      : await prisma.queueEntry.findFirst({
          where: {
            queueId: queue.id,
            status: QUEUE_ENTRY_STATUS.called,
          },
          orderBy: { calledAt: "desc" },
        });

    const current = serving ?? called;

    const waiting = await prisma.queueEntry.findMany({
      where: {
        queueId: queue.id,
        status: QUEUE_ENTRY_STATUS.waiting,
      },
      orderBy: { ticketNumber: "asc" },
    });

    const waitingList = waiting.map((entry, idx) => {
      const position = idx + 1;
      return {
        id: entry.id,
        ticketNumber: entry.ticketNumber,
        ticketDisplay: formatTicketDisplay(entry.ticketNumber),
        customerName: entry.customerName,
        status: entry.status,
        joinedAt: entry.joinedAt.toISOString(),
        position,
        estimatedWaitMinutes: estimateWaitTime(position, queue.avgServiceTime),
      };
    });

    return ok({
      queue: {
        id: queue.id,
        name: queue.name,
        status: queue.status,
        maxCapacity: queue.maxCapacity,
        avgServiceTime: queue.avgServiceTime,
        business: queue.business,
      },
      currentServing: current
        ? {
            id: current.id,
            ticketNumber: current.ticketNumber,
            ticketDisplay: formatTicketDisplay(current.ticketNumber),
            customerName: current.customerName,
            status: current.status,
            calledAt: current.calledAt?.toISOString() ?? null,
          }
        : null,
      totalWaiting: waitingList.length,
      waiting: waitingList,
    });
  } catch (err) {
    return fail(`خطأ في الخادم: ${String(err)}`, 500);
  }
}
