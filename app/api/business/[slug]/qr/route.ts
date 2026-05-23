import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export const runtime = "nodejs";

interface RouteParams {
  params: { slug: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const slug = params.slug?.trim();

  if (!slug) {
    return new NextResponse("Missing slug", { status: 400 });
  }

  // 30 QR generations per IP per minute. Cheaper than throttling a CDN.
  const ip = getClientIp(req);
  const limited = rateLimit(`qr:${ip}`, 30, 60_000);
  if (!limited.allowed) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const baseUrl = env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  const targetUrl = `${baseUrl}/q/${encodeURIComponent(slug)}`;

  const pngBuffer = await QRCode.toBuffer(targetUrl, {
    type: "png",
    width: 1200,
    margin: 2,
    color: {
      dark: "#0F766E",
      light: "#FFFFFF",
    },
  });

  return new NextResponse(new Uint8Array(pngBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
