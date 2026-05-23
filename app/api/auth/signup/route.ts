import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/origin";

export const runtime = "nodejs";

const signupSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح").max(120),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .max(72, "كلمة المرور طويلة جداً"),
  ownerName: z.string().trim().min(2, "الاسم قصير جداً").max(80).optional(),
  businessName: z.string().trim().min(2, "اسم المحل قصير").max(100),
  businessNameAr: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "الرابط قصير جداً")
    .max(40, "الرابط طويل جداً")
    .regex(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      "الرابط يقبل فقط حروفاً إنجليزية صغيرة وأرقاماً وشرطات",
    ),
  phone: z.string().trim().max(30).optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#0F766E"),
  timezone: z.string().trim().min(3).max(60).default("Asia/Riyadh"),
});

const RESERVED_SLUGS = new Set([
  "api",
  "dashboard",
  "q",
  "admin",
  "signup",
  "login",
  "privacy",
  "terms",
  "static",
  "_next",
]);

export async function POST(request: NextRequest) {
  const originErr = assertSameOrigin(request);
  if (originErr) return originErr;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const limited = rateLimit(`signup:${ip}`, 5, 60_000);
  if (!limited.allowed) {
    return errorResponse(
      "محاولات كثيرة. حاول مرة أخرى بعد قليل.",
      429,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("جسم الطلب غير صالح", 400);
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      parsed.error.issues[0]?.message ?? "بيانات غير صالحة",
      400,
    );
  }
  const data = parsed.data;

  if (RESERVED_SLUGS.has(data.slug)) {
    return errorResponse("هذا الرابط محجوز، اختر غيره.", 409);
  }

  // Uniqueness checks
  const [emailTaken, slugTaken] = await Promise.all([
    prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      select: { id: true },
    }),
    prisma.business.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    }),
  ]);
  if (emailTaken) {
    return errorResponse("هذا البريد مسجّل مسبقاً", 409);
  }
  if (slugTaken) {
    return errorResponse("هذا الرابط مستخدم، اختر غيره.", 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const business = await prisma.business.create({
    data: {
      name: data.businessName,
      nameAr: data.businessNameAr,
      slug: data.slug,
      phone: data.phone || null,
      primaryColor: data.primaryColor,
      timezone: data.timezone,
      queues: {
        create: [
          {
            name: "الطابور الرئيسي",
            status: "active",
            maxCapacity: 50,
            avgServiceTime: 15,
          },
        ],
      },
      members: {
        create: {
          role: "owner",
          user: {
            create: {
              email: data.email.toLowerCase(),
              name: data.ownerName || null,
              passwordHash,
            },
          },
        },
      },
    },
    select: {
      id: true,
      slug: true,
      nameAr: true,
    },
  });

  return successResponse({ business }, 201);
}
