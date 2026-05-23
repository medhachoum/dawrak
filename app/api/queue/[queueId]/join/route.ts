import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { QUEUE_ENTRY_STATUS, QUEUE_STATUS } from "@/lib/constants";
import {
  calculatePosition,
  estimateWaitTime,
  formatTicketDisplay,
  getNextTicketNumber,
  publishQueueEvent,
} from "@/lib/queue-utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface JoinBody {
  customerName?: unknown;
  customerPhone?: unknown;
}

function normalizePhone(input: string): string {
  // Strip spaces, dashes, parens; keep leading +
  return input.replace(/[\s()-]+/g, "");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { queueId: string } },
) {
  // CSRF: same-origin check on writes.
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  // Rate limit by IP: 5 joins per 60 seconds.
  const ip = getClientIp(req);
  const ipLimit = rateLimit(`join:ip:${ip}`, 5, 60_000);
  if (!ipLimit.allowed) {
    return fail("محاولات كثيرة من هذا الجهاز. حاول بعد قليل.", 429);
  }

  try {
    let body: JoinBody = {};
    try {
      body = (await req.json()) as JoinBody;
    } catch {
      body = {};
    }

    const customerName =
      typeof body.customerName === "string" ? body.customerName.trim() : "";
    const rawPhone =
      typeof body.customerPhone === "string" && body.customerPhone.trim() !== ""
        ? normalizePhone(body.customerPhone.trim())
        : null;
    const customerPhone = rawPhone || null;

    if (!customerName) {
      return fail("الاسم مطلوب", 400);
    }
    if (customerName.length > 80) {
      return fail("الاسم طويل جداً", 400);
    }
    if (customerPhone) {
      if (customerPhone.length > 20 || customerPhone.length < 6) {
        return fail("رقم الهاتف غير صالح", 400);
      }
      if (!/^\+?[0-9]+$/.test(customerPhone)) {
        return fail("رقم الهاتف يجب أن يحتوي أرقاماً فقط", 400);
      }
    }

    // Phone-level rate limit (1 join per phone per 15 minutes per queue) is
    // applied only when we're about to create a *new* entry — applying it
    // earlier would also block legitimate "I lost my link, rejoin me to my
    // existing ticket" recovery requests, which the anti-duplication block
    // below handles by returning the existing entry as-is.

    const queue = await prisma.queue.findUnique({
      where: { id: params.queueId },
    });
    if (!queue) {
      return fail("الطابور غير موجود", 404);
    }
    if (queue.status !== QUEUE_STATUS.active) {
      return fail("هذا الطابور غير مفتوح للانضمام حالياً", 409);
    }

    // Anti-duplication: if the same phone has an active entry, return it.
    if (customerPhone) {
      const existing = await prisma.queueEntry.findFirst({
        where: {
          queueId: queue.id,
          customerPhone,
          status: {
            in: [
              QUEUE_ENTRY_STATUS.waiting,
              QUEUE_ENTRY_STATUS.called,
              QUEUE_ENTRY_STATUS.serving,
            ],
          },
        },
        orderBy: { joinedAt: "desc" },
      });
      if (existing) {
        const position = await calculatePosition(existing.id);
        const estimatedWaitMinutes = estimateWaitTime(
          position,
          queue.avgServiceTime,
        );
        return ok({
          entry: {
            id: existing.id,
            queueId: existing.queueId,
            ticketNumber: existing.ticketNumber,
            ticketDisplay: formatTicketDisplay(existing.ticketNumber),
            customerName: existing.customerName,
            customerPhone: existing.customerPhone,
            status: existing.status,
            joinedAt: existing.joinedAt.toISOString(),
          },
          position,
          estimatedWaitMinutes,
          alreadyExists: true,
        });
      }
    }

    // No existing entry → applying the per-phone rate limit now (the limit's
    // intent is to prevent a single phone from spamming *new* tickets).
    if (customerPhone) {
      const phoneLimit = rateLimit(
        `join:phone:${params.queueId}:${customerPhone}`,
        1,
        15 * 60_000,
      );
      if (!phoneLimit.allowed) {
        return fail(
          "هذا الرقم انضمّ مؤخراً. تحقّق من تذكرتك الحالية أولاً.",
          429,
        );
      }
    }

    const waitingCount = await prisma.queueEntry.count({
      where: {
        queueId: queue.id,
        status: QUEUE_ENTRY_STATUS.waiting,
      },
    });
    if (waitingCount >= queue.maxCapacity) {
      return fail("الطابور ممتلئ", 409);
    }

    const ticketNumber = await getNextTicketNumber(queue.id);

    const entry = await prisma.queueEntry.create({
      data: {
        queueId: queue.id,
        ticketNumber,
        customerName,
        customerPhone,
        status: QUEUE_ENTRY_STATUS.waiting,
      },
    });

    const position = await calculatePosition(entry.id);
    const estimatedWaitMinutes = estimateWaitTime(
      position,
      queue.avgServiceTime,
    );

    publishQueueEvent({
      type: "join",
      queueId: queue.id,
      entryId: entry.id,
      ticketNumber: entry.ticketNumber,
      at: new Date().toISOString(),
    });

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
      position,
      estimatedWaitMinutes,
    });
  } catch (err) {
    return fail(`خطأ في الخادم: ${String(err)}`, 500);
  }
}
