import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { QUEUE_STATUS } from "@/lib/constants";
import { requireBusinessMember } from "@/lib/authz";
import { assertSameOrigin } from "@/lib/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  status: z
    .enum([QUEUE_STATUS.active, QUEUE_STATUS.paused, QUEUE_STATUS.closed])
    .default(QUEUE_STATUS.active),
  maxCapacity: z.number().int().min(1).max(500).default(50),
  avgServiceTime: z.number().int().min(1).max(240).default(15),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { businessId: string } },
) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const authz = await requireBusinessMember(params.businessId);
  if (authz instanceof NextResponse) return authz;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("جسم الطلب غير صالح", 400);
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة", 400);
  }

  const queue = await prisma.queue.create({
    data: {
      ...parsed.data,
      businessId: params.businessId,
    },
    select: {
      id: true,
      name: true,
      status: true,
      maxCapacity: true,
      avgServiceTime: true,
    },
  });
  return ok({ queue }, { status: 201 });
}
