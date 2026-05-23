"use client";

import { useCallback, useEffect, useState } from "react";

export interface BusinessStats {
  business: {
    id: string;
    nameAr: string;
    slug: string;
  };
  totalServedToday: number;
  currentlyWaiting: number;
  avgWaitMinutes: number;
  peakHour: number | null;
}

interface UseBusinessStatsResult {
  stats: BusinessStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBusinessStats(
  businessId: string | null,
  pollIntervalMs = 5000,
): UseBusinessStatsResult {
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/dashboard/${businessId}/stats`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "فشل تحميل الإحصائيات");
      }
      setStats(json.data);
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
    fetchStats();
    const t = window.setInterval(fetchStats, pollIntervalMs);
    return () => window.clearInterval(t);
  }, [businessId, fetchStats, pollIntervalMs]);

  return { stats, loading, error, refetch: fetchStats };
}
