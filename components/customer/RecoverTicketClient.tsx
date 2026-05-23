"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Phone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RecoverTicketClient({
  slug,
  businessName,
}: {
  slug: string;
  businessName: string;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/business/${slug}/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerPhone: phone }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "تعذّر استرجاع التذكرة");
        setSubmitting(false);
        return;
      }
      const entryId = json.data.entry.id;
      const queueId = json.data.entry.queueId;
      router.replace(`/q/${slug}/wait/${entryId}?queue=${queueId}`);
    } catch {
      setError("حدث خطأ أثناء الاتصال بالخادم");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-accent/40 via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href={`/q/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 rtl-mirror" />
          العودة لـ {businessName}
        </Link>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Search className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">استرجاع تذكرتك</CardTitle>
            <CardDescription>
              أدخل رقم الهاتف الذي انضممت به لنُعيدك إلى صفحة انتظارك مباشرة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-medium">
                  رقم الهاتف
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 w-full rounded-md border border-input bg-background pr-10 pl-3 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="+966 5xxxxxxxx"
                    dir="ltr"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                size="lg"
                className="w-full gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                استرجع تذكرتي
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
