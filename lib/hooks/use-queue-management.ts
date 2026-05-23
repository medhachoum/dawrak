"use client";

import { useCallback, useEffect, useState } from "react";

export interface QueueEntry {
  id: string;
  ticketNumber: number;
  ticketDisplay: string;
  customerName: string;
  customerPhone: string | null;
  status: string;
  joinedAt: string;
  calledAt: string | null;
}

export interface Queue {
  id: string;
  name: string;
  status: string;
  maxCapacity: number;
  avgServiceTime: number;
  entries: QueueEntry[];
}

export interface QueueBusiness {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  primaryColor: string;
  phone: string | null;
}

interface UseQueueManagementResult {
  business: QueueBusiness | null;
  queues: Queue[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  callNext: (queueId: string) => Promise<QueueEntry | null>;
  completeEntry: (queueId: string, entryId: string) => Promise<boolean>;
  markNoShow: (queueId: string, entryId: string) => Promise<boolean>;
}

export function useQueueManagement(
  businessId: string | null,
  pollIntervalMs = 5000,
): UseQueueManagementResult {
  const [business, setBusiness] = useState<QueueBusiness | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueues = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/dashboard/${businessId}/queues`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "فشل تحميل الطوابير");
      }
      setBusiness(json.data.business);
      setQueues(json.data.queues);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchQueues();
    const t = window.setInterval(fetchQueues, pollIntervalMs);
    return () => window.clearInterval(t);
  }, [businessId, fetchQueues, pollIntervalMs]);

  const callNext = useCallback(
    async (queueId: string): Promise<QueueEntry | null> => {
      const res = await fetch(`/api/dashboard/queue/${queueId}/next`, {
        method: "POST",
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "فشل استدعاء التالي");
      }
      await fetchQueues();
      return json.data.entry as QueueEntry;
    },
    [fetchQueues],
  );

  const completeEntry = useCallback(
    async (queueId: string, entryId: string): Promise<boolean> => {
      const res = await fetch(
        `/api/dashboard/queue/${queueId}/complete/${entryId}`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "فشل إكمال الخدمة");
      }
      await fetchQueues();
      return true;
    },
    [fetchQueues],
  );

  const markNoShow = useCallback(
    async (queueId: string, entryId: string): Promise<boolean> => {
      const res = await fetch(
        `/api/dashboard/queue/${queueId}/noshow/${entryId}`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "فشل تسجيل عدم الحضور");
      }
      await fetchQueues();
      return true;
    },
    [fetchQueues],
  );

  return {
    business,
    queues,
    loading,
    error,
    refetch: fetchQueues,
    callNext,
    completeEntry,
    markNoShow,
  };
}
