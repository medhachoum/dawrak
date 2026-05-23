"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { QueueCard } from "@/components/dashboard/queue-card";
import { ToastProvider } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { useBusinessSession } from "@/lib/hooks/use-business-session";
import { useBusinessStats } from "@/lib/hooks/use-business-stats";
import { useQueueManagement } from "@/lib/hooks/use-queue-management";

export default function DashboardHomePage() {
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
      <DashboardContent businessId={businessId} />
    </ToastProvider>
  );
}

function DashboardContent({ businessId }: { businessId: string }) {
  const { stats, loading: statsLoading, error: statsError } = useBusinessStats(
    businessId,
  );
  const {
    business,
    queues,
    loading: queuesLoading,
    error: queuesError,
    callNext,
    completeEntry,
    markNoShow,
  } = useQueueManagement(businessId);

  const businessName = business?.nameAr ?? stats?.business.nameAr ?? "—";

  // Auth failure (business not found) → redirect
  const invalidSession =
    statsError?.includes("غير موجود") || queuesError?.includes("غير موجود");

  if (invalidSession) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("dawrak:businessId");
      window.location.replace("/dashboard/login");
    }
    return null;
  }

  return (
    <DashboardShell businessName={businessName}>
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold">الرئيسية</h1>
          <p className="text-sm text-muted-foreground mt-1">
            نظرة سريعة على أداء المحل وإدارة الطوابير النشطة.
          </p>
        </div>

        <StatsGrid stats={stats} loading={statsLoading} />

        {(statsError || queuesError) && !invalidSession && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-4 text-sm text-destructive">
              {statsError || queuesError}
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-3">إدارة الطوابير</h2>
          {queuesLoading && queues.length === 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {[0, 1].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-6 w-40 bg-muted rounded animate-pulse" />
                    <div className="mt-4 h-14 bg-muted rounded animate-pulse" />
                    <div className="mt-4 space-y-2">
                      <div className="h-12 bg-muted rounded animate-pulse" />
                      <div className="h-12 bg-muted rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : queues.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                لا توجد طوابير في هذا المحل.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {queues.map((q) => (
                <QueueCard
                  key={q.id}
                  queue={q}
                  onCallNext={callNext}
                  onComplete={completeEntry}
                  onNoShow={markNoShow}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
