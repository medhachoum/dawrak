import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { formatTicketDisplay } from "@/lib/queue-utils";
import { requireBusinessMember } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInt(
  value: string | null,
  fallback: number,
  max?: number,
): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  if (max && n > max) return max;
  return n;
}

export async function GET(
  req: Request,
  { params }: { params: { businessId: string } },
) {
  const authz = await requireBusinessMember(params.businessId);
  if (authz instanceof NextResponse) return authz;

  try {
    const url = new URL(req.url);
    const page = parsePositiveInt(url.searchParams.get("page"), 1);
    const limit = parsePositiveInt(
      url.searchParams.get("limit"),
      DEFAULT_LIMIT,
      MAX_LIMIT,
    );
    const status = url.searchParams.get("status");
    const queueIdFilter = url.searchParams.get("queueId");

    const business = await prisma.business.findUnique({
      where: { id: params.businessId },
      select: { id: true, queues: { select: { id: true, name: true } } },
    });
    if (!business) {
      return fail("العمل التجاري غير موجود", 404);
    }

    const queueIds = business.queues.map((q) => q.id);
    const queueNameById = new Map(business.queues.map((q) => [q.id, q.name]));

    if (queueIds.length === 0) {
      return ok({
        entries: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const where: {
      queueId: { in: string[] } | string;
      status?: string;
    } = {
      queueId:
        queueIdFilter && queueIds.includes(queueIdFilter)
          ? queueIdFilter
          : { in: queueIds },
    };
    if (status) {
      where.status = status;
    }

    const [total, entries] = await Promise.all([
      prisma.queueEntry.count({ where }),
      prisma.queueEntry.findMany({
        where,
        orderBy: { joinedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const data = entries.map((e) => ({
      id: e.id,
      queueId: e.queueId,
      queueName: queueNameById.get(e.queueId) ?? null,
      ticketNumber: e.ticketNumber,
      ticketDisplay: formatTicketDisplay(e.ticketNumber),
      customerName: e.customerName,
      customerPhone: e.customerPhone,
      status: e.status,
      joinedAt: e.joinedAt.toISOString(),
      calledAt: e.calledAt?.toISOString() ?? null,
      completedAt: e.completedAt?.toISOString() ?? null,
    }));

    return ok({
      entries: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return fail(`خطأ في الخادم: ${String(err)}`, 500);
  }
}
