"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { captureException } from "@/lib/observability";

/**
 * Root error boundary. Next.js renders this whenever a server- or client-side
 * exception bubbles up out of a route. The reset() function lets the user
 * retry the failed render without a full page reload.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { digest: error.digest });
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-muted-foreground">
          آسفون، حصل خلل أثناء تحميل هذه الصفحة. حاول مرّة أخرى — إن استمرت
          المشكلة فأبلغ مزوّد الخدمة.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-muted-foreground/70 font-mono">
            id: {error.digest}
          </p>
        )}
        <div className="mt-6">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    </main>
  );
}
