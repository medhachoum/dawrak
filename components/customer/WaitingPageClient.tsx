"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CheckCircle2,
  LogOut,
  PartyPopper,
  Radio,
  Sparkles,
  Timer,
  Users,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, toArabicDigits } from "@/lib/utils";
import { useQueueStream } from "./hooks/useQueueStream";
import { useNotification } from "./hooks/useNotification";

export interface WaitingEntryInitial {
  id: string;
  queueId: string;
  ticketNumber: number;
  ticketDisplay: string;
  customerName: string;
  status: "waiting" | "called" | "serving" | "completed" | "noshow";
  joinedAt: string;
}

export interface WaitingQueueInitial {
  id: string;
  name: string;
  avgServiceTime: number;
  status: "active" | "paused" | "closed";
}

interface WaitingPageClientProps {
  shopSlug: string;
  shopNameAr: string;
  primaryColor: string;
  entry: WaitingEntryInitial;
  queue: WaitingQueueInitial;
  initialPosition: number;
  initialEstimatedWaitMinutes: number;
  initialTotalWaiting: number;
}

interface StatusPayload {
  success: boolean;
  data?: {
    totalWaiting: number;
    waiting: Array<{ id: string; position: number; estimatedWaitMinutes: number }>;
  };
}

interface EntryPayload {
  success: boolean;
  data?: {
    entry: {
      id: string;
      status: WaitingEntryInitial["status"];
      ticketNumber: number;
      ticketDisplay: string;
    };
    position: number;
    estimatedWaitMinutes: number;
  };
}

export function WaitingPageClient({
  shopSlug,
  shopNameAr,
  primaryColor,
  entry,
  queue,
  initialPosition,
  initialEstimatedWaitMinutes,
  initialTotalWaiting,
}: WaitingPageClientProps) {
  const router = useRouter();
  const { permission, requestPermission, notify, vibrate, playAlertSound } =
    useNotification();

  const [position, setPosition] = useState(initialPosition);
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initialEstimatedWaitMinutes,
  );
  const [totalWaiting, setTotalWaiting] = useState(initialTotalWaiting);
  const [status, setStatus] = useState<WaitingEntryInitial["status"]>(
    entry.status,
  );
  const [leaving, setLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const alertedRef = useRef(false);

  // Fetch latest status from the REST endpoint.
  const refresh = useCallback(async () => {
    try {
      const [entryRes, statusRes] = await Promise.all([
        fetch(`/api/queue/${queue.id}/entry/${entry.id}`, {
          cache: "no-store",
        }),
        fetch(`/api/queue/${queue.id}/status`, { cache: "no-store" }),
      ]);

      const entryJson = (await entryRes.json()) as EntryPayload;
      const statusJson = (await statusRes.json()) as StatusPayload;

      if (entryJson.success && entryJson.data) {
        setStatus(entryJson.data.entry.status);
        setPosition(entryJson.data.position);
        setEstimatedMinutes(entryJson.data.estimatedWaitMinutes);
      }
      if (statusJson.success && statusJson.data) {
        setTotalWaiting(statusJson.data.totalWaiting);
        // Defensive sync in case entry endpoint was slower
        const mine = statusJson.data.waiting.find((w) => w.id === entry.id);
        if (mine) {
          setPosition(mine.position);
          setEstimatedMinutes(mine.estimatedWaitMinutes);
        }
      }
    } catch {
      // Network hiccup; SSE will re-trigger soon.
    }
  }, [entry.id, queue.id]);

  // SSE connection
  const { connected } = useQueueStream({
    queueId: queue.id,
    onEvent: (ev) => {
      if (ev.type === "heartbeat" || ev.type === "connected") return;

      // If this event is targeted at us, act immediately
      if (ev.entryId === entry.id) {
        if (ev.type === "called") {
          setStatus("called");
          return;
        }
        if (ev.type === "completed") {
          setStatus("completed");
          return;
        }
        if (ev.type === "noshow") {
          setStatus("noshow");
          return;
        }
      }
      // Otherwise, refresh position/wait estimate
      void refresh();
    },
  });

  // Ask for notification permission once the page loads.
  useEffect(() => {
    if (permission === "default") {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  // When status flips to "called" -> big alert + sound + vibration + push
  useEffect(() => {
    if (status !== "called") return;
    if (alertedRef.current) return;
    alertedRef.current = true;

    playAlertSound();
    vibrate([300, 150, 300, 150, 600]);

    if (permission === "granted") {
      notify("دَوْرَك الآن! 🎉", {
        body: `${shopNameAr} — تذكرة ${entry.ticketDisplay}. توجّه إلى الموظف.`,
        tag: `dawrak-call-${entry.id}`,
        requireInteraction: true,
      });
    }
  }, [
    status,
    entry.id,
    entry.ticketDisplay,
    shopNameAr,
    permission,
    notify,
    playAlertSound,
    vibrate,
  ]);

  // Periodic refresh as a safety net (in case SSE misses events)
  useEffect(() => {
    const id = setInterval(() => {
      if (status === "waiting") void refresh();
    }, 20_000);
    return () => clearInterval(id);
  }, [refresh, status]);

  const handleLeave = useCallback(async () => {
    setLeaving(true);
    try {
      await fetch(`/api/queue/${queue.id}/entry/${entry.id}`, {
        method: "DELETE",
      });
    } catch {
      // swallow
    } finally {
      router.push(`/q/${shopSlug}`);
    }
  }, [entry.id, queue.id, router, shopSlug]);

  // Derived UI state
  const progressPercent = useMemo(() => {
    if (status !== "waiting") return 100;
    if (totalWaiting <= 0) return 100;
    // Position 1 -> close to 100%; last position -> low %
    const behind = Math.max(totalWaiting - position, 0);
    const denom = Math.max(totalWaiting, 1);
    return Math.min(100, Math.max(5, Math.round((behind / denom) * 100)));
  }, [position, totalWaiting, status]);

  // --- Called overlay (hero screen) ---
  if (status === "called") {
    return <CalledOverlay entry={entry} shopNameAr={shopNameAr} />;
  }

  if (status === "completed" || status === "serving") {
    return (
      <TerminalScreen
        title={status === "serving" ? "دورك الآن، توجّه للخدمة" : "اكتملت خدمتك"}
        subtitle={
          status === "serving"
            ? "الموظف في انتظارك. شكراً لاستخدامك دَوْرَك."
            : "نتمنى لك يوماً سعيداً!"
        }
        icon={<CheckCircle2 className="h-16 w-16" aria-hidden />}
        accent={primaryColor}
        onBack={() => router.push(`/q/${shopSlug}`)}
      />
    );
  }

  if (status === "noshow") {
    return (
      <TerminalScreen
        title="غادرتَ الطابور"
        subtitle="إذا كنت لا تزال بحاجة إلى الخدمة، يمكنك حجز دور جديد."
        icon={<LogOut className="h-16 w-16" aria-hidden />}
        accent={primaryColor}
        onBack={() => router.push(`/q/${shopSlug}`)}
      />
    );
  }

  // --- WAITING ---
  return (
    <main
      className="min-h-screen flex flex-col bg-gradient-to-b from-background to-accent/20"
      style={{
        // Make it feel branded
        backgroundImage: `radial-gradient(ellipse at top, ${primaryColor}14 0%, transparent 60%)`,
      }}
    >
      {/* Top bar */}
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">محل</p>
          <p className="font-semibold truncate">{shopNameAr}</p>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionBadge connected={connected} />
          <NotificationBadge permission={permission} />
        </div>
      </header>

      {/* Boarding-pass style ticket card */}
      <section className="px-4 sm:px-6 pt-2 pb-6">
        <div
          className="relative mx-auto w-full max-w-md rounded-3xl shadow-xl overflow-hidden"
          style={{ backgroundColor: primaryColor }}
        >
          {/* Perforation dots */}
          <div
            className="absolute top-1/2 -right-3 h-6 w-6 rounded-full bg-background"
            aria-hidden
          />
          <div
            className="absolute top-1/2 -left-3 h-6 w-6 rounded-full bg-background"
            aria-hidden
          />

          <div className="text-white px-6 pt-6 pb-5">
            <div className="flex items-center gap-2 text-white/80 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              تذكرتك
            </div>
            <div className="mt-1 text-sm text-white/80">{queue.name}</div>

            <div
              dir="ltr"
              className={cn(
                "mt-4 text-7xl sm:text-8xl font-black tabular-nums tracking-tight",
                "drop-shadow-sm leading-none",
              )}
            >
              {entry.ticketDisplay}
            </div>
            <div className="mt-2 text-white/80 text-sm">
              باسم{" "}
              <span className="font-semibold text-white">
                {entry.customerName}
              </span>
            </div>
          </div>

          {/* Dashed divider */}
          <div
            className="mx-4 border-t border-dashed border-white/40"
            aria-hidden
          />

          {/* Bottom stub: position & wait */}
          <div className="text-white px-6 py-5 grid grid-cols-2 gap-4">
            <Stat
              label="موقعك الآن"
              value={
                position > 0
                  ? toArabicDigits(position)
                  : "—"
              }
              sublabel={
                position > 0 ? (position === 1 ? "أنت التالي!" : "في الانتظار") : undefined
              }
              icon={<Users className="h-4 w-4" aria-hidden />}
            />
            <Stat
              label="الوقت المتوقع"
              value={
                estimatedMinutes <= 0
                  ? "قريباً"
                  : `${toArabicDigits(estimatedMinutes)} د`
              }
              icon={<Timer className="h-4 w-4" aria-hidden />}
            />
          </div>
        </div>
      </section>

      {/* Progress bar */}
      <section className="px-6 pb-2">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>تقدّمك في الطابور</span>
            <span className="tabular-nums">
              {toArabicDigits(progressPercent)}٪
            </span>
          </div>
          <div
            className="relative h-3 rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="absolute inset-y-0 right-0 rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor}bb 100%)`,
              }}
            />
            {position === 1 && (
              <div
                className="absolute inset-y-0 right-0 rounded-full animate-pulse-soft"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: `${primaryColor}55`,
                }}
                aria-hidden
              />
            )}
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            {position === 1 ? (
              <span className="font-semibold text-foreground">
                أنت التالي — كن جاهزاً
              </span>
            ) : (
              <>
                أنت رقم{" "}
                <span className="font-bold text-foreground tabular-nums">
                  {toArabicDigits(position)}
                </span>{" "}
                في الانتظار
                {totalWaiting > 0 && (
                  <>
                    {" "}
                    من أصل{" "}
                    <span className="font-bold text-foreground tabular-nums">
                      {toArabicDigits(totalWaiting)}
                    </span>
                  </>
                )}
              </>
            )}
          </p>
        </div>
      </section>

      {/* Notification prompt (if default/denied) */}
      {permission !== "granted" && (
        <section className="px-6 pt-4">
          <div className="mx-auto w-full max-w-md rounded-xl border bg-card px-4 py-3 flex items-start gap-3 shadow-sm">
            <div
              className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}18` }}
            >
              <Bell
                className="h-4 w-4"
                style={{ color: primaryColor }}
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">فعّل الإشعارات</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                لنخبرك فور اقتراب دورك حتى لو كانت الشاشة مغلقة.
              </p>
            </div>
            {permission === "default" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void requestPermission()}
              >
                تفعيل
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground self-center">
                مرفوض
              </span>
            )}
          </div>
        </section>
      )}

      {/* Leave button pinned near bottom */}
      <div className="mt-auto px-6 py-6">
        <div className="mx-auto w-full max-w-md">
          {showLeaveConfirm ? (
            <div className="rounded-xl border bg-card p-4 shadow-sm animate-in fade-in-50 slide-in-from-bottom-2">
              <p className="text-sm font-semibold">
                هل أنت متأكد من مغادرة الطابور؟
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                سيتم إلغاء تذكرتك ولن تتمكن من استعادتها.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={leaving}
                  onClick={handleLeave}
                >
                  {leaving ? "جاري المغادرة..." : "نعم، غادر"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={leaving}
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  تراجع
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-destructive"
              onClick={() => setShowLeaveConfirm(true)}
            >
              <LogOut className="h-4 w-4" />
              مغادرة الطابور
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function Stat({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-white/70">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums leading-tight">
        {value}
      </div>
      {sublabel && (
        <div className="text-[11px] text-white/80 mt-0.5">{sublabel}</div>
      )}
    </div>
  );
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
        connected
          ? "bg-success/10 text-success"
          : "bg-muted text-muted-foreground",
      )}
      title={connected ? "متصل بالبث المباشر" : "غير متصل"}
    >
      {connected ? (
        <Radio className="h-3 w-3 animate-pulse-soft" aria-hidden />
      ) : (
        <WifiOff className="h-3 w-3" aria-hidden />
      )}
      {connected ? "مباشر" : "إعادة الاتصال"}
    </span>
  );
}

function NotificationBadge({
  permission,
}: {
  permission: "default" | "granted" | "denied" | "unsupported";
}) {
  if (permission === "granted") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-[11px] font-medium text-accent-foreground"
        title="الإشعارات مفعّلة"
      >
        <Bell className="h-3 w-3" aria-hidden />
        إشعارات
      </span>
    );
  }
  if (permission === "denied") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground"
        title="الإشعارات مرفوضة"
      >
        <BellOff className="h-3 w-3" aria-hidden />
        مرفوضة
      </span>
    );
  }
  return null;
}

function CalledOverlay({
  entry,
  shopNameAr,
}: {
  entry: WaitingEntryInitial;
  shopNameAr: string;
}) {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 text-white overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(135deg, hsl(var(--success)) 0%, hsl(142 72% 28%) 100%)",
      }}
    >
      {/* Confetti-ish circles */}
      <div
        className="absolute top-10 right-10 h-40 w-40 rounded-full bg-white/10 animate-pulse-soft"
        aria-hidden
      />
      <div
        className="absolute bottom-16 left-10 h-56 w-56 rounded-full bg-white/10 animate-pulse-soft"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center text-center animate-in zoom-in-50 fade-in duration-500">
        <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30 animate-bounce">
          <PartyPopper className="h-12 w-12" aria-hidden />
        </div>

        <h1 className="mt-6 text-5xl sm:text-6xl font-black tracking-tight drop-shadow">
          دَوْرَك الآن!
        </h1>
        <p className="mt-3 text-lg sm:text-xl opacity-95">
          توجّه إلى الموظف في {shopNameAr}
        </p>

        <div
          dir="ltr"
          className="mt-8 rounded-2xl bg-white/15 backdrop-blur-md px-8 py-4 ring-2 ring-white/30 shadow-lg"
        >
          <div className="text-xs uppercase tracking-widest opacity-80 text-center">
            TICKET
          </div>
          <div className="mt-1 text-5xl sm:text-6xl font-black tabular-nums">
            {entry.ticketDisplay}
          </div>
        </div>

        <p className="mt-10 text-sm opacity-90 font-semibold">
          {entry.customerName}
        </p>
      </div>
    </main>
  );
}

function TerminalScreen({
  title,
  subtitle,
  icon,
  accent,
  onBack,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
  onBack: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div
        className="h-20 w-20 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: `${accent}18`,
          color: accent,
        }}
      >
        {icon}
      </div>
      <h1 className="mt-5 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">{subtitle}</p>
      <Button
        className="mt-8"
        style={{ backgroundColor: accent, color: "white" }}
        onClick={onBack}
      >
        العودة للصفحة الرئيسية
      </Button>
    </main>
  );
}
