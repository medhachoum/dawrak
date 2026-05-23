import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { QUEUE_STATUS } from "@/lib/constants";
import { requireQueueOwner } from "@/lib/authz";
import { assertSameOrigin } from "@/lib/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  status: z
    .enum([QUEUE_STATUS.active, QUEUE_STATUS.paused, QUEUE_STATUS.closed])
    .optional(),
  maxCapacity: z.number().int().min(1).max(500).optional(),
  avgServiceTime: z.number().int().min(1).max(240).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { queueId: string } },
) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const authz = await requireQueueOwner(params.queueId);
  if (authz instanceof NextResponse) return authz;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("جسم الطلب غير صالح", 400);
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة", 400);
  }
  if (Object.keys(parsed.data).length === 0) {
    return fail("لا تغييرات", 400);
  }

  const queue = await prisma.queue.update({
    where: { id: params.queueId },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      status: true,
      maxCapacity: true,
      avgServiceTime: true,
    },
  });
  return ok({ queue });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { queueId: string } },
) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const authz = await requireQueueOwner(params.queueId);
  if (authz instanceof NextResponse) return authz;

  await prisma.queue.delete({ where: { id: params.queueId } });
  return ok({ ok: true });
}
