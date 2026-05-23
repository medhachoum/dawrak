import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { QUEUE_ENTRY_STATUS } from "@/lib/constants";
import { publishQueueEvent } from "@/lib/queue-utils";
import { requireQueueOwner } from "@/lib/authz";
import { assertSameOrigin } from "@/lib/origin";

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
      select: { id: true },
    });
    if (!queue) {
      return fail("الطابور غير موجود", 404);
    }

    const now = new Date();
    const result = await prisma.queueEntry.updateMany({
      where: {
        queueId: queue.id,
        status: {
          in: [
            QUEUE_ENTRY_STATUS.waiting,
            QUEUE_ENTRY_STATUS.called,
            QUEUE_ENTRY_STATUS.serving,
          ],
        },
      },
      data: {
        status: QUEUE_ENTRY_STATUS.noshow,
        completedAt: now,
      },
    });

    publishQueueEvent({
      type: "reset",
      queueId: queue.id,
      at: new Date().toISOString(),
    });

    return ok({
      queueId: queue.id,
      markedNoShow: result.count,
    });
  } catch (err) {
    return fail(`خطأ في الخادم: ${String(err)}`, 500);
  }
}
