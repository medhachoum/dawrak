import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { QUEUE_ENTRY_STATUS } from "@/lib/constants";
import {
  calculatePosition,
  estimateWaitTime,
  formatTicketDisplay,
} from "@/lib/queue-utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RecoverBody {
  customerPhone?: unknown;
}

function normalizePhone(input: string): string {
  return input.replace(/[\s()-]+/g, "");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const ip = getClientIp(req);
  const limited = rateLimit(`recover:ip:${ip}`, 10, 60_000);
  if (!limited.allowed) {
    return fail("محاولات كثيرة. حاول بعد قليل.", 429);
  }

  let body: RecoverBody = {};
  try {
    body = (await req.json()) as RecoverBody;
  } catch {
    body = {};
  }
  const phone =
    typeof body.customerPhone === "string"
      ? normalizePhone(body.customerPhone.trim())
      : "";
  if (!phone || phone.length < 6 || !/^\+?[0-9]+$/.test(phone)) {
    return fail("رقم هاتف غير صالح", 400);
  }

  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    select: { id: true, queues: { select: { id: true } } },
  });
  if (!business) return fail("المحل غير موجود", 404);

  const queueIds = business.queues.map((q) => q.id);
  if (queueIds.length === 0) return fail("لا توجد طوابير لهذا المحل", 404);

  const entry = await prisma.queueEntry.findFirst({
    where: {
      queueId: { in: queueIds },
      customerPhone: phone,
      status: {
        in: [
          QUEUE_ENTRY_STATUS.waiting,
          QUEUE_ENTRY_STATUS.called,
          QUEUE_ENTRY_STATUS.serving,
        ],
      },
    },
    orderBy: { joinedAt: "desc" },
    include: {
      queue: { select: { id: true, name: true, avgServiceTime: true } },
    },
  });

  if (!entry) {
    return fail("لم نعثر على تذكرة فعّالة بهذا الرقم", 404);
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
    },
    queue: entry.queue,
    position,
    estimatedWaitMinutes,
  });
}
