import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, service: "dawrak", db: "up" });
  } catch (err) {
    return NextResponse.json(
      { ok: false, service: "dawrak", db: "down", error: String(err) },
      { status: 500 },
    );
  }
}
