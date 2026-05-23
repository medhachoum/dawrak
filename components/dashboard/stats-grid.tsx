"use client";

import { CheckCircle2, Users, Clock, TrendingUp } from "lucide-react";
import { StatCard } from "./stat-card";
import { toArabicDigits } from "@/lib/utils";
import type { BusinessStats } from "@/lib/hooks/use-business-stats";

function formatHour(hour: number | null): string {
  if (hour === null) return "—";
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const suffix = hour < 12 ? "ص" : "م";
  return `${toArabicDigits(h)} ${suffix}`;
}

export function StatsGrid({
  stats,
  loading,
}: {
  stats: BusinessStats | null;
  loading: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="تمت خدمتهم اليوم"
        value={stats ? toArabicDigits(stats.totalServedToday) : "٠"}
        hint="منذ بداية اليوم"
        icon={CheckCircle2}
        accent="success"
        loading={loading}
      />
      <StatCard
        label="في الانتظار حالياً"
        value={stats ? toArabicDigits(stats.currentlyWaiting) : "٠"}
        hint="عبر كل الطوابير"
        icon={Users}
        accent="primary"
        loading={loading}
      />
      <StatCard
        label="متوسط الانتظار"
        value={
          stats
            ? `${toArabicDigits(stats.avgWaitMinutes)} د`
            : "٠ د"
        }
        hint="للزبائن المكتملين اليوم"
        icon={Clock}
        accent="warning"
        loading={loading}
      />
      <StatCard
        label="ساعة الذروة"
        value={stats ? formatHour(stats.peakHour) : "—"}
        hint="أكثر الأوقات ازدحاماً"
        icon={TrendingUp}
        accent="info"
        loading={loading}
      />
    </div>
  );
}
