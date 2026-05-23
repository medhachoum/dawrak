"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Filter,
  Loader2,
  History as HistoryIcon,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ToastProvider } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, toArabicDigits } from "@/lib/utils";
import { formatDateAr, formatTimeAr } from "@/lib/date";
import { useBusinessSession } from "@/lib/hooks/use-business-session";
import {
  QUEUE_ENTRY_STATUS_AR,
  type QueueEntryStatus,
} from "@/lib/constants";

interface HistoryEntry {
  id: string;
  queueId: string;
  queueName: string | null;
  ticketNumber: number;
  ticketDisplay: string;
  customerName: string;
  customerPhone: string | null;
  status: string;
  joinedAt: string;
  calledAt: string | null;
  completedAt: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type StatusFilter = "all" | "completed" | "noshow";

export default function DashboardHistoryPage() {
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
      <HistoryContent businessId={businessId} />
    </ToastProvider>
  );
}

function HistoryContent({ businessId }: { businessId: string }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [queues, setQueues] = useState<{ id: string; name: string }[]>([]);
  const [businessName, setBusinessName] = useState<string>("—");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [queueFilter, setQueueFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load queues list once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/dashboard/${businessId}/queues`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "");
        if (cancelled) return;
        setQueues(
          json.data.queues.map(
            (q: { id: string; name: string }) => ({
              id: q.id,
              name: q.name,
            }),
          ),
        );
        setBusinessName(json.data.business?.nameAr ?? "—");
      } catch {
        // ignore, handled by main fetch below
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (queueFilter !== "all") params.set("queueId", queueFilter);
      const res = await fetch(
        `/api/dashboard/${businessId}/history?${params.toString()}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "فشل تحميل السجل");
      setEntries(json.data.entries);
      setPagination(json.data.pagination);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [businessId, page, statusFilter, queueFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, queueFilter]);

  return (
    <DashboardShell businessName={businessName}>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HistoryIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">سجل العملاء</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              جميع العملاء السابقين عبر كل الطوابير.
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="h-4 w-4" />
                تصفية:
              </div>

              <div className="flex gap-2 flex-wrap">
                <FilterPill
                  active={statusFilter === "all"}
                  onClick={() => setStatusFilter("all")}
                >
                  الكل
                </FilterPill>
                <FilterPill
                  active={statusFilter === "completed"}
                  onClick={() => setStatusFilter("completed")}
                >
                  مكتمل
                </FilterPill>
                <FilterPill
                  active={statusFilter === "noshow"}
                  onClick={() => setStatusFilter("noshow")}
                >
                  لم يحضر
                </FilterPill>
              </div>

              <div className="flex-1 lg:flex lg:justify-end">
                <select
                  value={queueFilter}
                  onChange={(e) => setQueueFilter(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[180px]"
                >
                  <option value="all">كل الطوابير</option>
                  {queues.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {error && (
              <div className="p-4 text-sm text-destructive bg-destructive/5 border-b border-destructive/20">
                {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <th className="px-4 py-3">التذكرة</th>
                    <th className="px-4 py-3">الزبون</th>
                    <th className="px-4 py-3 hidden md:table-cell">الطابور</th>
                    <th className="px-4 py-3">الحالة</th>
                    <th className="px-4 py-3 hidden sm:table-cell">الانضمام</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && entries.length === 0 ? (
                    [0, 1, 2, 3, 4].map((i) => (
                      <tr key={i} className="border-b">
                        {[0, 1, 2, 3, 4].map((j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-muted rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : entries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        لا توجد سجلات تطابق التصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    entries.map((e) => {
                      const status = e.status as QueueEntryStatus;
                      return (
                        <tr
                          key={e.id}
                          className="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3 font-bold tabular-nums">
                            {e.ticketDisplay}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{e.customerName}</div>
                            {e.customerPhone && (
                              <div className="text-xs text-muted-foreground tabular-nums">
                                {toArabicDigits(e.customerPhone)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                            {e.queueName ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={status} />
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                            <div className="text-xs">
                              {formatDateAr(e.joinedAt)}
                            </div>
                            <div className="text-xs tabular-nums">
                              {formatTimeAr(e.joinedAt)}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {pagination.total > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t p-4 text-sm">
                <div className="text-muted-foreground">
                  إظهار{" "}
                  <span className="font-medium text-foreground">
                    {toArabicDigits(
                      (pagination.page - 1) * pagination.limit + 1,
                    )}
                  </span>{" "}
                  -{" "}
                  <span className="font-medium text-foreground">
                    {toArabicDigits(
                      Math.min(
                        pagination.page * pagination.limit,
                        pagination.total,
                      ),
                    )}
                  </span>{" "}
                  من{" "}
                  <span className="font-medium text-foreground">
                    {toArabicDigits(pagination.total)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="gap-1"
                  >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </Button>
                  <div className="px-3 py-1.5 text-sm tabular-nums">
                    {toArabicDigits(pagination.page)} /{" "}
                    {toArabicDigits(pagination.totalPages || 1)}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    disabled={page >= pagination.totalPages || loading}
                    className="gap-1"
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full border px-4 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30",
      )}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: QueueEntryStatus }) {
  const variant =
    status === "completed"
      ? "success"
      : status === "noshow"
        ? "destructive"
        : status === "called" || status === "serving"
          ? "warning"
          : "secondary";
  return <Badge variant={variant}>{QUEUE_ENTRY_STATUS_AR[status]}</Badge>;
}
