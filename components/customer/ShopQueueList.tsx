"use client";

import { useState } from "react";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QUEUE_STATUS_AR, type QueueStatus } from "@/lib/constants";
import { toArabicDigits } from "@/lib/utils";
import { JoinQueueDialog } from "./JoinQueueDialog";

export interface ShopQueueCardData {
  id: string;
  name: string;
  status: QueueStatus;
  waitingCount: number;
  avgServiceTime: number;
}

interface ShopQueueListProps {
  shopSlug: string;
  primaryColor: string;
  queues: ShopQueueCardData[];
}

export function ShopQueueList({
  shopSlug,
  primaryColor,
  queues,
}: ShopQueueListProps) {
  const [selected, setSelected] = useState<ShopQueueCardData | null>(null);

  if (queues.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Users
                className="h-7 w-7"
                style={{ color: primaryColor }}
                aria-hidden
              />
            </div>
            <p className="text-base">لا توجد طوابير مفتوحة حالياً.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {queues.map((q) => {
          const status = q.status;
          const isActive = status === "active";
          const isPaused = status === "paused";
          return (
            <li key={q.id}>
              <Card
                className={
                  "overflow-hidden transition-all duration-200 " +
                  (isActive
                    ? "hover:shadow-lg hover:-translate-y-0.5"
                    : "opacity-80")
                }
              >
                {/* Color accent stripe */}
                <div
                  className="h-1"
                  style={{
                    backgroundColor: isActive
                      ? primaryColor
                      : "hsl(var(--muted))",
                  }}
                  aria-hidden
                />
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                  <div className="min-w-0">
                    <CardTitle className="text-lg">{q.name}</CardTitle>
                    <CardDescription className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        <span>
                          في الانتظار:{" "}
                          <span className="font-semibold text-foreground tabular-nums">
                            {toArabicDigits(q.waitingCount)}
                          </span>
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        <span>
                          وقت الخدمة ~{" "}
                          <span className="tabular-nums">
                            {toArabicDigits(q.avgServiceTime)}
                          </span>{" "}
                          د
                        </span>
                      </span>
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      isActive
                        ? "success"
                        : isPaused
                          ? "warning"
                          : "secondary"
                    }
                    className="shrink-0"
                  >
                    {QUEUE_STATUS_AR[status]}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    disabled={!isActive}
                    size="lg"
                    className="w-full font-semibold shadow-sm transition-transform active:scale-[0.98] group"
                    style={
                      isActive
                        ? { backgroundColor: primaryColor, color: "white" }
                        : undefined
                    }
                    onClick={() => isActive && setSelected(q)}
                  >
                    <span>{isActive ? "انضم للطابور" : "غير متاح"}</span>
                    {isActive && (
                      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <JoinQueueDialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        queue={selected}
        shopSlug={shopSlug}
        primaryColor={primaryColor}
      />
    </>
  );
}
