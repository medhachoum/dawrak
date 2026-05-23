import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/api-response";

export interface AuthorizedSession {
  userId: string;
  email: string;
}

export interface AuthorizedBusiness {
  userId: string;
  email: string;
  businessId: string;
  role: string;
}

/**
 * Returns the current user or a 401 response.
 *
 * Usage in a route handler:
 *   const auth = await requireUser();
 *   if (auth instanceof Response) return auth;
 *   // auth.userId is now guaranteed
 */
export async function requireUser(): Promise<AuthorizedSession | NextResponse> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return errorResponse("غير مصرّح", 401);
  }
  return { userId: session.user.id, email: session.user.email };
}

/**
 * Asserts the current user is a member of the given business.
 * Returns either authorized context, or a 401/403 NextResponse to short-circuit.
 *
 * Pass the businessId you derived from the route params. The check uses an
 * indexed query on (userId, businessId).
 */
export async function requireBusinessMember(
  businessId: string,
): Promise<AuthorizedBusiness | NextResponse> {
  const userOrError = await requireUser();
  if (userOrError instanceof NextResponse) return userOrError;

  const member = await prisma.businessMember.findUnique({
    where: {
      userId_businessId: {
        userId: userOrError.userId,
        businessId,
      },
    },
    select: { role: true },
  });

  if (!member) {
    return errorResponse("غير مصرّح بالوصول إلى هذا المحل", 403);
  }

  return {
    ...userOrError,
    businessId,
    role: member.role,
  };
}

/**
 * Like requireBusinessMember but resolves the businessId from a queueId.
 * Useful for /api/dashboard/queue/[queueId]/* routes.
 */
export async function requireQueueOwner(
  queueId: string,
): Promise<AuthorizedBusiness | NextResponse> {
  const userOrError = await requireUser();
  if (userOrError instanceof NextResponse) return userOrError;

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    select: { businessId: true },
  });
  if (!queue) {
    return errorResponse("الطابور غير موجود", 404);
  }

  const member = await prisma.businessMember.findUnique({
    where: {
      userId_businessId: {
        userId: userOrError.userId,
        businessId: queue.businessId,
      },
    },
    select: { role: true },
  });

  if (!member) {
    return errorResponse("غير مصرّح بالوصول إلى هذا الطابور", 403);
  }

  return {
    ...userOrError,
    businessId: queue.businessId,
    role: member.role,
  };
}
