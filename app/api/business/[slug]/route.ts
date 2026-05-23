import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { QUEUE_ENTRY_STATUS, QUEUE_STATUS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const business = await prisma.business.findUnique({
      where: { slug: params.slug },
      include: {
        queues: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!business) {
      return fail("العمل التجاري غير موجود", 404);
    }

    const queueIds = business.queues.map((q) => q.id);
    const waitingCounts = queueIds.length
      ? await prisma.queueEntry.groupBy({
          by: ["queueId"],
          where: {
            queueId: { in: queueIds },
            status: QUEUE_ENTRY_STATUS.waiting,
          },
          _count: { _all: true },
        })
      : [];

    const waitingMap = new Map<string, number>();
    for (const row of waitingCounts) {
      waitingMap.set(row.queueId, row._count._all);
    }

    const queues = business.queues.map((q) => ({
      id: q.id,
      name: q.name,
      status: q.status,
      maxCapacity: q.maxCapacity,
      avgServiceTime: q.avgServiceTime,
      waitingCount: waitingMap.get(q.id) ?? 0,
      isAcceptingJoins: q.status === QUEUE_STATUS.active,
    }));

    return ok({
      id: business.id,
      name: business.name,
      nameAr: business.nameAr,
      slug: business.slug,
      logo: business.logo,
      primaryColor: business.primaryColor,
      phone: business.phone,
      queues,
    });
  } catch (err) {
    return fail(`خطأ في الخادم: ${String(err)}`, 500);
  }
}
