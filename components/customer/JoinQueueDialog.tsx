"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserRound, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface JoinQueueDialogProps {
  open: boolean;
  onClose: () => void;
  queue: {
    id: string;
    name: string;
    waitingCount: number;
    avgServiceTime: number;
  } | null;
  shopSlug: string;
  primaryColor: string;
}

interface JoinResponse {
  success: boolean;
  data?: {
    entry: { id: string; queueId: string; ticketDisplay: string };
  };
  error?: string;
}

export function JoinQueueDialog({
  open,
  onClose,
  queue,
  shopSlug,
  primaryColor,
}: JoinQueueDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form each time dialog opens
  useEffect(() => {
    if (open) {
      setName("");
      setPhone("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || !queue) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("يرجى إدخال اسمك");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/queue/${queue.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: trimmed,
          customerPhone: phone.trim() || undefined,
        }),
      });
      const json = (await res.json()) as JoinResponse;
      if (!res.ok || !json.success || !json.data) {
        setError(json.error ?? "تعذّر الانضمام، حاول مجدداً");
        setSubmitting(false);
        return;
      }
      const entryId = json.data.entry.id;
      router.push(`/q/${shopSlug}/wait/${entryId}`);
    } catch {
      setError("تعذّر الاتصال بالخادم");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-dialog-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="إغلاق"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !submitting && onClose()}
      />

      {/* Sheet / Modal */}
      <div
        className={cn(
          "relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl",
          "animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300",
        )}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header strip with shop color */}
        <div
          className="h-2 sm:rounded-t-2xl"
          style={{ backgroundColor: primaryColor }}
          aria-hidden
        />

        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="join-dialog-title"
                className="text-xl sm:text-2xl font-bold"
              >
                انضم إلى {queue.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                أدخل بياناتك لحجز دورك
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              aria-label="إغلاق"
              className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="customer-name">
                الاسم <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <UserRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="customer-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك"
                  maxLength={80}
                  required
                  disabled={submitting}
                  className="pr-10"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-phone">
                رقم الجوال{" "}
                <span className="text-muted-foreground text-xs">(اختياري)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="customer-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  maxLength={30}
                  disabled={submitting}
                  className="pr-10"
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive animate-in fade-in-50"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full text-base font-semibold shadow-md transition-transform active:scale-[0.98]"
              style={{
                backgroundColor: primaryColor,
                color: "white",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحجز...
                </>
              ) : (
                "تأكيد الحجز"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
