"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { ...t, id }]);
      window.setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const Icon =
    toast.variant === "success"
      ? CheckCircle2
      : toast.variant === "error"
        ? AlertCircle
        : Info;

  const colorClass =
    toast.variant === "success"
      ? "border-success/30 bg-success/10 text-success"
      : toast.variant === "error"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-primary/30 bg-primary/10 text-primary";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-background p-4 shadow-lg animate-in slide-in-from-top-2 fade-in duration-200",
        colorClass,
      )}
      role="status"
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 text-foreground">
        <div className="text-sm font-semibold">{toast.title}</div>
        {toast.description && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {toast.description}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="إغلاق"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
