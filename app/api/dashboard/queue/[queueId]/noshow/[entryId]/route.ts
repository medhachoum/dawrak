import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { QUEUE_ENTRY_STATUS } from "@/lib/constants";
import { formatTicketDisplay, publishQueueEvent } from "@/lib/queue-utils";
import { requireQueueOwner } from "@/lib/authz";
import { assertSameOrigin } from "@/lib/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { queueId: string; entryId: string } },
) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const authz = await requireQueueOwner(params.queueId);
  if (authz instanceof NextResponse) return authz;

  try {
    const entry = await prisma.queueEntry.findUnique({
      where: { id: params.entryId },
    });
    if (!entry || entry.queueId !== params.queueId) {
      return fail("التذكرة غير موجودة", 404);
    }
    if (entry.status === QUEUE_ENTRY_STATUS.completed) {
      return fail("التذكرة مكتملة بالفعل ولا يمكن تعليمها كـ'لم يحضر'", 409);
    }

    const updated = await prisma.queueEntry.update({
      where: { id: entry.id },
      data: {
        status: QUEUE_ENTRY_STATUS.noshow,
        completedAt: new Date(),
      },
    });

    publishQueueEvent({
      type: "noshow",
      queueId: updated.queueId,
      entryId: updated.id,
      ticketNumber: updated.ticketNumber,
      at: new Date().toISOString(),
    });

    return ok({
      entry: {
        id: updated.id,
        queueId: updated.queueId,
        ticketNumber: updated.ticketNumber,
        ticketDisplay: formatTicketDisplay(updated.ticketNumber),
        customerName: updated.customerName,
        status: updated.status,
        joinedAt: updated.joinedAt.toISOString(),
        completedAt: updated.completedAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    return fail(`خطأ في الخادم: ${String(err)}`, 500);
  }
}
