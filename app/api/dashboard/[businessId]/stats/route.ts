import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { QUEUE_ENTRY_STATUS } from "@/lib/constants";
import { getTodayRange, hourInTimezone } from "@/lib/queue-utils";
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
        timezone: true,
        queues: { select: { id: true } },
      },
    });
    if (!business) {
      return fail("العمل التجاري غير موجود", 404);
    }

    const queueIds = business.queues.map((q) => q.id);
    if (queueIds.length === 0) {
      return ok({
        business: { id: business.id, nameAr: business.nameAr, slug: business.slug },
        totalServedToday: 0,
        currentlyWaiting: 0,
        avgWaitMinutes: 0,
        peakHour: null,
      });
    }

    const { start, end } = getTodayRange(business.timezone);
    const baseWhere = { queueId: { in: queueIds } } as const;
    const todayWhere = { ...baseWhere, joinedAt: { gte: start, lt: end } };

    const [totalServedToday, currentlyWaiting, completedToday] =
      await Promise.all([
        prisma.queueEntry.count({
          where: {
            ...todayWhere,
            status: QUEUE_ENTRY_STATUS.completed,
          },
        }),
        prisma.queueEntry.count({
          where: {
            ...baseWhere,
            status: QUEUE_ENTRY_STATUS.waiting,
          },
        }),
        prisma.queueEntry.findMany({
          where: {
            ...todayWhere,
            status: QUEUE_ENTRY_STATUS.completed,
            calledAt: { not: null },
          },
          select: { joinedAt: true, calledAt: true },
        }),
      ]);

    let avgWaitMinutes = 0;
    if (completedToday.length > 0) {
      const totalWait = completedToday.reduce((sum, e) => {
        if (!e.calledAt) return sum;
        const diffMs = e.calledAt.getTime() - e.joinedAt.getTime();
        return sum + Math.max(0, diffMs);
      }, 0);
      avgWaitMinutes = Math.round(
        totalWait / completedToday.length / 60_000,
      );
    }

    // Peak hour: which hour of today has the most joinedAt entries.
    const joinedToday = await prisma.queueEntry.findMany({
      where: todayWhere,
      select: { joinedAt: true },
    });

    let peakHour: number | null = null;
    if (joinedToday.length > 0) {
      const hours = new Array<number>(24).fill(0);
      for (const e of joinedToday) {
        hours[hourInTimezone(e.joinedAt, business.timezone)] += 1;
      }
      let best = 0;
      for (let h = 1; h < 24; h++) {
        if (hours[h] > hours[best]) best = h;
      }
      peakHour = hours[best] > 0 ? best : null;
    }

    return ok({
      business: {
        id: business.id,
        nameAr: business.nameAr,
        slug: business.slug,
      },
      totalServedToday,
      currentlyWaiting,
      avgWaitMinutes,
      peakHour,
    });
  } catch (err) {
    return fail(`خطأ في الخادم: ${String(err)}`, 500);
  }
}
