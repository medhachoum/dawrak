import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { QUEUE_ENTRY_STATUS } from "@/lib/constants";
import { formatTicketDisplay } from "@/lib/queue-utils";
import { requireBusinessMember } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { businessId: string } },
) {
  const authz = await requireBusinessMember(params.businessId);
  if (authz instanceof NextResponse) return authz;

  try {
    const business = await prisma.business.findUnique({
      where: { id: params.businessId },
      select: {
        id: true,
        name: true,
        nameAr: true,
        slug: true,
        primaryColor: true,
        phone: true,
      },
    });
    if (!business) {
      return fail("العمل التجاري غير موجود", 404);
    }

    const queues = await prisma.queue.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "asc" },
      include: {
        entries: {
          where: {
            status: {
              in: [
                QUEUE_ENTRY_STATUS.waiting,
                QUEUE_ENTRY_STATUS.called,
                QUEUE_ENTRY_STATUS.serving,
              ],
            },
          },
          orderBy: { ticketNumber: "asc" },
        },
      },
    });

    const data = queues.map((q) => ({
      id: q.id,
      name: q.name,
      status: q.status,
      maxCapacity: q.maxCapacity,
      avgServiceTime: q.avgServiceTime,
      entries: q.entries.map((e) => ({
        id: e.id,
        ticketNumber: e.ticketNumber,
        ticketDisplay: formatTicketDisplay(e.ticketNumber),
        customerName: e.customerName,
        customerPhone: e.customerPhone,
        status: e.status,
        joinedAt: e.joinedAt.toISOString(),
        calledAt: e.calledAt?.toISOString() ?? null,
      })),
    }));

    return ok({
      business,
      queues: data,
    });
  } catch (err) {
    return fail(`خطأ في الخادم: ${String(err)}`, 500);
  }
}
