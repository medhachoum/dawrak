"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  Download,
  Loader2,
  Printer,
  QrCode as QrCodeIcon,
  Scan,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToastProvider } from "@/components/ui/toast";
import { useBusinessSession } from "@/lib/hooks/use-business-session";

interface BusinessInfo {
  id: string;
  nameAr: string;
  name: string;
  slug: string;
}

export default function DashboardQrPage() {
  const router = useRouter();
  const { businessId, hydrated } = useBusinessSession();

  useEffect(() => {
    if (hydrated && !businessId) {
      router.replace("/dashboard/login");
    }
  }, [hydrated, businessId, router]);

  if (!hydrated || !businessId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <ToastProvider>
      <QrPageContent businessId={businessId} />
    </ToastProvider>
  );
}

function QrPageContent({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrReady, setQrReady] = useState(false);

  // Fetch business info
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/dashboard/${businessId}/queues`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "فشل تحميل بيانات المحل");
        if (cancelled) return;
        setBusiness(json.data.business);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  // Invalid session → logout
  useEffect(() => {
    if (error?.includes("غير موجود")) {
      try {
        window.localStorage.removeItem("dawrak:businessId");
      } catch {
        // ignore
      }
      router.replace("/dashboard/login");
    }
  }, [error, router]);

  const targetUrl =
    business && typeof window !== "undefined"
      ? `${window.location.origin}/q/${business.slug}`
      : "";

  // Render QR onto canvas once we have the slug
  useEffect(() => {
    if (!targetUrl || !canvasRef.current) return;
    setQrReady(false);
    QRCode.toCanvas(canvasRef.current, targetUrl, {
      width: 560,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#0F766E",
        light: "#FFFFFF",
      },
    })
      .then(() => setQrReady(true))
      .catch(() => setQrReady(false));
  }, [targetUrl]);

  const handleDownload = useCallback(async () => {
    if (!business) return;
    try {
      // Use the server QR route for a clean, high-resolution PNG.
      const res = await fetch(`/api/business/${business.slug}/qr`);
      if (!res.ok) throw new Error("تعذر إنشاء صورة QR");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dawrak-qr-${business.slug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: use the client canvas.
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dawrak-qr-${business.slug}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
    }
  }, [business]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const businessName = business?.nameAr ?? "—";

  return (
    <DashboardShell businessName={businessName}>
      {/* Print-only styles: hide shell chrome and show card full page */}
      <style>{`
        @media print {
          body { background: #fff !important; }
          aside, header, .no-print { display: none !important; }
          main { padding: 0 !important; }
          .print-area {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            max-width: 100% !important;
          }
          .print-card {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3 no-print">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <QrCodeIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">رمز QR الخاص بمحلك</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              اطبع الرمز وعلّقه في المحل ليُتيح للزبائن حجز دورهم بمسحة واحدة.
            </p>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-6 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        ) : !business ? null : (
          <>
            {/* The printable card */}
            <div className="print-area">
              <Card className="print-card overflow-hidden shadow-lg">
                <CardContent className="p-0">
                  <div className="relative bg-gradient-to-br from-primary/10 via-accent/40 to-background px-8 pt-10 pb-6 text-center">
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-base font-bold">
                        د
                      </span>
                      دَوْرَك
                    </div>
                    <h2 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
                      {business.nameAr}
                    </h2>
                    <p className="mt-2 text-sm md:text-base text-muted-foreground flex items-center justify-center gap-1.5">
                      <Scan className="h-4 w-4" />
                      امسح الرمز لحجز دورك فوراً
                    </p>
                  </div>

                  <div className="flex flex-col items-center px-6 pb-8 pt-4">
                    <div className="rounded-2xl border-4 border-primary/10 bg-white p-4 shadow-sm">
                      {!qrReady && (
                        <div className="flex h-[280px] w-[280px] md:h-[360px] md:w-[360px] items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      <canvas
                        ref={canvasRef}
                        className={
                          qrReady
                            ? "block h-[280px] w-[280px] md:h-[360px] md:w-[360px]"
                            : "hidden"
                        }
                      />
                    </div>

                    <div className="mt-6 text-center">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        أو افتح الرابط مباشرة
                      </div>
                      <div
                        className="mt-1 font-mono text-sm md:text-base text-primary break-all"
                        dir="ltr"
                      >
                        {targetUrl}
                      </div>
                    </div>

                    <div className="mt-6 grid w-full grid-cols-3 gap-4 border-t pt-5 text-center text-xs md:text-sm">
                      <Step num="١" label="امسح" />
                      <Step num="٢" label="سجّل" />
                      <Step num="٣" label="تابع دورك" />
                    </div>

                    <div className="mt-5 text-[11px] text-muted-foreground">
                      مدعوم بواسطة دَوْرَك · dawrak
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action bar (hidden when printing) */}
            <div className="no-print flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handlePrint}
                size="lg"
                className="gap-2 flex-1 sm:flex-initial"
              >
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
              <Button
                onClick={handleDownload}
                size="lg"
                variant="outline"
                className="gap-2 flex-1 sm:flex-initial"
              >
                <Download className="h-4 w-4" />
                تحميل PNG
              </Button>
            </div>

            <Card className="no-print bg-muted/30 border-dashed">
              <CardContent className="p-5 text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">نصيحة:</strong> اطبع الرمز
                بحجم A5 على الأقل، وعلّقه قرب مدخل المحل أو على طاولة الانتظار.
                لن يحتاج الزبون لأي تطبيق — مجرد مسح سريع ويدخل الطابور.
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function Step({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold tabular-nums">
        {num}
      </div>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
