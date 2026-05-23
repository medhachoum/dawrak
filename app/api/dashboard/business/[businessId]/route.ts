import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { requireBusinessMember } from "@/lib/authz";
import { assertSameOrigin } from "@/lib/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  nameAr: z.string().trim().min(2).max(100).optional(),
  phone: z
    .union([
      z
        .string()
        .trim()
        .max(30)
        .transform((v) => (v.length > 0 ? v : null)),
      z.null(),
    ])
    .optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  timezone: z.string().trim().min(3).max(60).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { businessId: string } },
) {
  const authz = await requireBusinessMember(params.businessId);
  if (authz instanceof NextResponse) return authz;

  const business = await prisma.business.findUnique({
    where: { id: params.businessId },
    select: {
      id: true,
      name: true,
      nameAr: true,
      slug: true,
      phone: true,
      primaryColor: true,
      timezone: true,
    },
  });
  if (!business) return fail("المحل غير موجود", 404);
  return ok({ business });
}

export async function PATCH(
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة", 400);
  }

  const updated = await prisma.business.update({
    where: { id: params.businessId },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      nameAr: true,
      slug: true,
      phone: true,
      primaryColor: true,
      timezone: true,
    },
  });
  return ok({ business: updated });
}
