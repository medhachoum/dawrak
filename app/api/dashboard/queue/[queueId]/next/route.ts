import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { QUEUE_ENTRY_STATUS } from "@/lib/constants";
import { formatTicketDisplay, publishQueueEvent } from "@/lib/queue-utils";
import { requireQueueOwner } from "@/lib/authz";
import { assertSameOrigin } from "@/lib/origin";
import { sendCallNotification } from "@/lib/sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { queueId: string } },
) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const authz = await requireQueueOwner(params.queueId);
  if (authz instanceof NextResponse) return authz;

  try {
    const queue = await prisma.queue.findUnique({
      where: { id: params.queueId },
      include: { business: { select: { nameAr: true } } },
    });
    if (!queue) {
      return fail("الطابور غير موجود", 404);
    }

    const next = await prisma.queueEntry.findFirst({
      where: {
        queueId: queue.id,
        status: QUEUE_ENTRY_STATUS.waiting,
      },
      orderBy: { ticketNumber: "asc" },
    });
    if (!next) {
      return fail("لا يوجد أحد في الانتظار", 404);
    }

    const updated = await prisma.queueEntry.update({
      where: { id: next.id },
      data: {
        status: QUEUE_ENTRY_STATUS.called,
        calledAt: new Date(),
      },
    });

    publishQueueEvent({
      type: "called",
      queueId: queue.id,
      entryId: updated.id,
      ticketNumber: updated.ticketNumber,
      at: new Date().toISOString(),
    });

    // Fire-and-forget SMS (no-op unless SMS_PROVIDER is configured).
    if (updated.customerPhone) {
      sendCallNotification({
        phone: updated.customerPhone,
        customerName: updated.customerName,
        ticketDisplay: formatTicketDisplay(updated.ticketNumber),
        businessName: queue.business.nameAr,
      }).catch((e) => console.error("[sms]", e));
    }

    return ok({
      entry: {
        id: updated.id,
        queueId: updated.queueId,
        ticketNumber: updated.ticketNumber,
        ticketDisplay: formatTicketDisplay(updated.ticketNumber),
        customerName: updated.customerName,
        customerPhone: updated.customerPhone,
        status: updated.status,
        joinedAt: updated.joinedAt.toISOString(),
        calledAt: updated.calledAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    return fail(`خطأ في الخادم: ${String(err)}`, 500);
  }
}
