import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-response";
import { requireUser } from "@/lib/authz";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userOrError = await requireUser();
  if (userOrError instanceof NextResponse) return userOrError;

  try {
    const memberships = await prisma.businessMember.findMany({
      where: { userId: userOrError.userId },
      orderBy: { createdAt: "asc" },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            slug: true,
            primaryColor: true,
            phone: true,
            timezone: true,
            createdAt: true,
            _count: {
              select: { queues: true },
            },
          },
        },
      },
    });

    const businesses = memberships.map((m) => ({
      ...m.business,
      role: m.role,
    }));

    return successResponse({ businesses });
  } catch (error) {
    console.error("[GET /api/dashboard/businesses]", error);
    return errorResponse("فشل تحميل قائمة المحلات", 500);
  }
}
