import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api-response";
import { assertCronAuthorized } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Anonymizes customer PII (name + phone) on QueueEntry records older than
 * the retention window (default 30 days), and deletes very-old entries
 * entirely (default 365 days).
 *
 * Authorization: `Authorization: Bearer $CRON_SECRET` (Vercel Cron)
 *             OR `?token=$CRON_SECRET` (other schedulers).
 * Schedule: once daily.
 */
const PII_RETENTION_DAYS = 30;
const HARD_DELETE_DAYS = 365;

export async function POST(req: NextRequest) {
  return run(req);
}
export async function GET(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest): Promise<NextResponse> {
  const denied = assertCronAuthorized(req);
  if (denied) return denied;

  const now = Date.now();
  const piiCutoff = new Date(now - PII_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const deleteCutoff = new Date(now - HARD_DELETE_DAYS * 24 * 60 * 60 * 1000);

  const anonymized = await prisma.queueEntry.updateMany({
    where: {
      joinedAt: { lt: piiCutoff },
      OR: [
        { customerPhone: { not: null } },
        { customerName: { not: "زبون مجهول" } },
      ],
    },
    data: {
      customerName: "زبون مجهول",
      customerPhone: null,
    },
  });

  const deleted = await prisma.queueEntry.deleteMany({
    where: { joinedAt: { lt: deleteCutoff } },
  });

  return ok({
    anonymized: anonymized.count,
    deleted: deleted.count,
    piiRetentionDays: PII_RETENTION_DAYS,
    hardDeleteDays: HARD_DELETE_DAYS,
  });
}
