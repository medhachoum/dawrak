"use client";

import { useState } from "react";
import {
  CheckCircle2,
  UserCheck,
  UserX,
  Users,
  BellRing,
  Loader2,
  Megaphone,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, toArabicDigits } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  QUEUE_ENTRY_STATUS_AR,
  QUEUE_STATUS_AR,
  type QueueEntryStatus,
  type QueueStatus,
} from "@/lib/constants";
import type { Queue, QueueEntry } from "@/lib/hooks/use-queue-management";
import { timeAgoAr } from "@/lib/date";

interface QueueCardProps {
  queue: Queue;
  onCallNext: (queueId: string) => Promise<QueueEntry | null>;
  onComplete: (queueId: string, entryId: string) => Promise<boolean>;
  onNoShow: (queueId: string, entryId: string) => Promise<boolean>;
}

export function QueueCard({
  queue,
  onCallNext,
  onComplete,
  onNoShow,
}: QueueCardProps) {
  const { toast } = useToast();
  const [calling, setCalling] = useState(false);
  const [justCalled, setJustCalled] = useState<QueueEntry | null>(null);
  const [pendingEntryId, setPendingEntryId] = useState<string | null>(null);

  const status = queue.status as QueueStatus;
  const isActive = status === "active";
  const waiting = queue.entries.filter((e) => e.status === "waiting");
  const called = queue.entries.filter(
    (e) => e.status === "called" || e.status === "serving",
  );

  const handleCallNext = async () => {
    if (calling || waiting.length === 0) return;
    setCalling(true);
    try {
      const entry = await onCallNext(queue.id);
      if (entry) {
        setJustCalled(entry);
        toast({
          variant: "success",
          title: "تم النداء بنجاح",
          description: `${entry.ticketDisplay} — ${entry.customerName}`,
        });
        window.setTimeout(() => setJustCalled(null), 4000);
      }
    } catch (e) {
      toast({
        variant: "error",
        title: "فشل النداء",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setCalling(false);
    }
  };

  const handleComplete = async (entry: QueueEntry) => {
    setPendingEntryId(entry.id);
    try {
      await onComplete(queue.id, entry.id);
      toast({
        variant: "success",
        title: "تم إكمال الخدمة",
        description: `${entry.ticketDisplay} — ${entry.customerName}`,
      });
    } catch (e) {
      toast({
        variant: "error",
        title: "فشل إكمال الخدمة",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setPendingEntryId(null);
    }
  };

  const handleNoShow = async (entry: QueueEntry) => {
    setPendingEntryId(entry.id);
    try {
      await onNoShow(queue.id, entry.id);
      toast({
        variant: "info",
        title: "تم التسجيل كـ 'لم يحضر'",
        description: `${entry.ticketDisplay} — ${entry.customerName}`,
      });
    } catch (e) {
      toast({
        variant: "error",
        title: "فشل التحديث",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setPendingEntryId(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 bg-muted/30 border-b">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            {queue.name}
            <Badge
              variant={
                status === "active"
                  ? "success"
                  : status === "paused"
                    ? "warning"
                    : "secondary"
              }
            >
              {QUEUE_STATUS_AR[status]}
            </Badge>
          </CardTitle>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {toArabicDigits(waiting.length)} في الانتظار
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />~
              {toArabicDigits(queue.avgServiceTime)} د / زبون
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5">
        {/* Recently called announcement */}
        {justCalled && (
          <div className="relative rounded-lg border-2 border-success/40 bg-success/5 p-4 animate-in zoom-in-95 fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success/20 text-success animate-pulse-soft">
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-success">
                  تم النداء الآن
                </div>
                <div className="mt-0.5 text-lg font-bold truncate">
                  {justCalled.customerName}
                </div>
              </div>
              <div className="text-2xl font-bold tabular-nums text-success">
                {justCalled.ticketDisplay}
              </div>
            </div>
          </div>
        )}

        {/* Call next button */}
        <Button
          onClick={handleCallNext}
          disabled={!isActive || waiting.length === 0 || calling}
          size="xl"
          className="w-full gap-2"
        >
          {calling ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <BellRing className="h-5 w-5" />
          )}
          {calling
            ? "جارٍ النداء..."
            : waiting.length === 0
              ? "لا يوجد أحد في الانتظار"
              : "نادِ التالي"}
        </Button>

        {/* Currently called/serving entries */}
        {called.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              قيد الخدمة / تم النداء
            </div>
            {called.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                pending={pendingEntryId === entry.id}
                onComplete={() => handleComplete(entry)}
                onNoShow={() => handleNoShow(entry)}
                highlighted
              />
            ))}
          </div>
        )}

        {/* Waiting list */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            قائمة الانتظار ({toArabicDigits(waiting.length)})
          </div>
          {waiting.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-background py-8 text-center text-sm text-muted-foreground">
              لا يوجد أحد في قائمة الانتظار حالياً.
            </div>
          ) : (
            waiting.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                pending={pendingEntryId === entry.id}
                onComplete={() => handleComplete(entry)}
                onNoShow={() => handleNoShow(entry)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EntryRow({
  entry,
  pending,
  onComplete,
  onNoShow,
  highlighted,
}: {
  entry: QueueEntry;
  pending: boolean;
  onComplete: () => void;
  onNoShow: () => void;
  highlighted?: boolean;
}) {
  const status = entry.status as QueueEntryStatus;
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border bg-background p-3 transition-colors",
        highlighted && "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={cn(
            "flex h-10 w-14 shrink-0 items-center justify-center rounded-md font-bold tabular-nums text-sm",
            highlighted
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {entry.ticketDisplay}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{entry.customerName}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            انضم {timeAgoAr(entry.joinedAt)}
            {status !== "waiting" && (
              <Badge variant="outline" className="mr-2 text-[10px] py-0">
                {QUEUE_ENTRY_STATUS_AR[status]}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 sm:shrink-0">
        <Button
          size="sm"
          variant="success"
          onClick={onComplete}
          disabled={pending}
          className="gap-1 flex-1 sm:flex-none"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserCheck className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">أكمل</span>
          <CheckCircle2 className="sm:hidden h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onNoShow}
          disabled={pending}
          className="gap-1 flex-1 sm:flex-none text-muted-foreground hover:text-destructive hover:border-destructive/40"
        >
          <UserX className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">لم يحضر</span>
        </Button>
      </div>
    </div>
  );
}
