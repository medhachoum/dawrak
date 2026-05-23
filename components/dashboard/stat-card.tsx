"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent: "primary" | "success" | "warning" | "info";
  loading?: boolean;
}

const ACCENT_CLASSES: Record<StatCardProps["accent"], string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-accent text-accent-foreground",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  loading,
}: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-muted-foreground">
              {label}
            </div>
            {loading ? (
              <div className="mt-2 h-8 w-20 animate-pulse rounded bg-muted" />
            ) : (
              <div className="mt-1 text-3xl font-bold tabular-nums truncate">
                {value}
              </div>
            )}
            {hint && !loading && (
              <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
            )}
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
              ACCENT_CLASSES[accent],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
