"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Loader2,
  Pencil,
  Plus,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastProvider, useToast } from "@/components/ui/toast";
import {
  QUEUE_STATUS,
  QUEUE_STATUS_AR,
  type QueueStatus,
} from "@/lib/constants";
import { useBusinessSession } from "@/lib/hooks/use-business-session";

interface BusinessForm {
  id: string;
  nameAr: string;
  name: string;
  phone: string;
  primaryColor: string;
  timezone: string;
  slug: string;
}

interface QueueRow {
  id: string;
  name: string;
  status: QueueStatus;
  maxCapacity: number;
  avgServiceTime: number;
}

const TIMEZONE_OPTIONS = [
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Kuwait",
  "Asia/Qatar",
  "Asia/Bahrain",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Tunis",
  "Africa/Algiers",
  "UTC",
];

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { businessId, hydrated } = useBusinessSession();

  useEffect(() => {
    if (hydrated && !businessId) {
      router.replace("/dashboard/login");
    }
  }, [hydrated, businessId, router]);

  if (!hydrated || !businessId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <ToastProvider>
      <SettingsContent businessId={businessId} />
    </ToastProvider>
  );
}

function SettingsContent({ businessId }: { businessId: string }) {
  const { toast } = useToast();
  const [business, setBusiness] = useState<BusinessForm | null>(null);
  const [queues, setQueues] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [bizRes, queuesRes] = await Promise.all([
        fetch(`/api/dashboard/business/${businessId}`, { cache: "no-store" }),
        fetch(`/api/dashboard/${businessId}/queues`, { cache: "no-store" }),
      ]);
      const bizJson = await bizRes.json();
      const queuesJson = await queuesRes.json();
      if (!bizJson.success) {
        throw new Error(bizJson.error ?? "تعذر تحميل بيانات المحل");
      }
      if (!queuesJson.success) {
        throw new Error(queuesJson.error ?? "تعذر تحميل الطوابير");
      }
      const b = bizJson.data.business;
      setBusiness({
        id: b.id,
        nameAr: b.nameAr,
        name: b.name,
        phone: b.phone ?? "",
        primaryColor: b.primaryColor,
        timezone: b.timezone,
        slug: b.slug,
      });
      setQueues(
        (queuesJson.data.queues as QueueRow[]).map((q) => ({
          id: q.id,
          name: q.name,
          status: q.status,
          maxCapacity: q.maxCapacity,
          avgServiceTime: q.avgServiceTime,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const businessName = business?.nameAr ?? "—";

  return (
    <DashboardShell businessName={businessName}>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الإعدادات</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              تحكّم في بيانات المحل وأدِر الطوابير المعروضة على زبائنك.
            </p>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-4 flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </CardContent>
          </Card>
        )}

        {loading || !business ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
          <>
            <BusinessForm
              business={business}
              onSaved={(b) => {
                setBusiness(b);
                toast({
                  variant: "success",
                  title: "تم الحفظ",
                  description: "تحدّثت بيانات المحل بنجاح.",
                });
              }}
              onError={(msg) =>
                toast({
                  variant: "error",
                  title: "تعذّر الحفظ",
                  description: msg,
                })
              }
            />

            <QueuesSection
              businessId={businessId}
              queues={queues}
              onChanged={async () => {
                await reload();
              }}
              onToast={(variant, title, description) =>
                toast({ variant, title, description })
              }
            />
          </>
        )}
      </div>
    </DashboardShell>
  );
}

interface BusinessFormProps {
  business: BusinessForm;
  onSaved: (b: BusinessForm) => void;
  onError: (msg: string) => void;
}

function BusinessForm({ business, onSaved, onError }: BusinessFormProps) {
  const [form, setForm] = useState(business);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(business);
  }, [business]);

  const dirty = useMemo(
    () =>
      form.nameAr !== business.nameAr ||
      form.name !== business.name ||
      (form.phone || "") !== (business.phone || "") ||
      form.primaryColor !== business.primaryColor ||
      form.timezone !== business.timezone,
    [form, business],
  );

  const onChange = (key: keyof BusinessForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/business/${business.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          nameAr: form.nameAr.trim(),
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          primaryColor: form.primaryColor,
          timezone: form.timezone,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "تعذّر الحفظ");
      }
      const b = json.data.business;
      onSaved({
        id: b.id,
        nameAr: b.nameAr,
        name: b.name,
        phone: b.phone ?? "",
        primaryColor: b.primaryColor,
        timezone: b.timezone,
        slug: b.slug,
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>بيانات المحل</CardTitle>
        <CardDescription>
          سيظهر هذا الاسم للزبائن في صفحة المحل وفي بطاقة QR.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="nameAr">الاسم بالعربية</Label>
            <Input
              id="nameAr"
              value={form.nameAr}
              onChange={onChange("nameAr")}
              maxLength={100}
              required
              minLength={2}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">الاسم بالإنجليزية</Label>
            <Input
              id="name"
              value={form.name}
              onChange={onChange("name")}
              maxLength={100}
              required
              minLength={2}
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={onChange("phone")}
              maxLength={30}
              placeholder="0500000000"
              inputMode="tel"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="primaryColor">اللون الرئيسي</Label>
            <div className="flex items-center gap-2">
              <input
                id="primaryColor"
                type="color"
                value={form.primaryColor}
                onChange={onChange("primaryColor")}
                className="h-11 w-14 rounded-md border bg-background p-1"
              />
              <Input
                value={form.primaryColor}
                onChange={onChange("primaryColor")}
                pattern="#[0-9a-fA-F]{6}"
                maxLength={7}
                dir="ltr"
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="timezone">المنطقة الزمنية</Label>
            <select
              id="timezone"
              value={form.timezone}
              onChange={onChange("timezone")}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
              {!TIMEZONE_OPTIONS.includes(form.timezone) && (
                <option value={form.timezone}>{form.timezone}</option>
              )}
            </select>
            <p className="text-xs text-muted-foreground">
              تُستخدم في حساب «إحصائيات اليوم» وعرض ساعات الذروة.
            </p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>رابط المحل</Label>
            <div
              className="flex h-11 items-center rounded-md border border-input bg-muted px-3 text-sm font-mono text-muted-foreground"
              dir="ltr"
            >
              /q/{business.slug}
            </div>
            <p className="text-xs text-muted-foreground">
              لا يمكن تعديل الرابط من هنا. تواصل مع الدعم لتغييره.
            </p>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={!dirty || saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              حفظ التغييرات
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface QueuesSectionProps {
  businessId: string;
  queues: QueueRow[];
  onChanged: () => Promise<void>;
  onToast: (
    variant: "success" | "error" | "info",
    title: string,
    description?: string,
  ) => void;
}

function QueuesSection({
  businessId,
  queues,
  onChanged,
  onToast,
}: QueuesSectionProps) {
  const [editing, setEditing] = useState<QueueRow | null>(null);
  const [creating, setCreating] = useState(false);

  const onCreate = async (form: QueueFormValues) => {
    const res = await fetch(`/api/dashboard/business/${businessId}/queues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error ?? "تعذّر إنشاء الطابور");
    }
    setCreating(false);
    await onChanged();
    onToast("success", "تم إنشاء الطابور");
  };

  const onPatch = async (queueId: string, form: QueueFormValues) => {
    const res = await fetch(`/api/dashboard/queue/${queueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error ?? "تعذّر تحديث الطابور");
    }
    setEditing(null);
    await onChanged();
    onToast("success", "تم تحديث الطابور");
  };

  const onDelete = async (queue: QueueRow) => {
    const ok = window.confirm(
      `هل أنت متأكد من حذف طابور «${queue.name}»؟ سيتم حذف كل سجلاته.`,
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/dashboard/queue/${queue.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "تعذّر الحذف");
      }
      await onChanged();
      onToast("success", "تم حذف الطابور");
    } catch (err) {
      onToast(
        "error",
        "تعذّر الحذف",
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>الطوابير</CardTitle>
          <CardDescription>
            أنشئ طوابير منفصلة لكل خدمة (مثلاً: قص شعر، حلاقة لحية).
          </CardDescription>
        </div>
        <Button
          onClick={() => setCreating(true)}
          size="sm"
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          إضافة طابور
        </Button>
      </CardHeader>
      <CardContent>
        {creating && (
          <div className="mb-4">
            <QueueFormCard
              title="طابور جديد"
              initial={{
                name: "",
                status: QUEUE_STATUS.active,
                maxCapacity: 50,
                avgServiceTime: 15,
              }}
              submitLabel="إنشاء"
              onCancel={() => setCreating(false)}
              onSubmit={async (values) => {
                try {
                  await onCreate(values);
                } catch (err) {
                  onToast(
                    "error",
                    "تعذّر الإنشاء",
                    err instanceof Error ? err.message : undefined,
                  );
                }
              }}
            />
          </div>
        )}

        {queues.length === 0 && !creating ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            لا توجد طوابير بعد. أضِف أوّل طابور للبدء.
          </div>
        ) : (
          <ul className="space-y-3">
            {queues.map((q) => (
              <li
                key={q.id}
                className="rounded-lg border bg-background p-4"
              >
                {editing?.id === q.id ? (
                  <QueueFormCard
                    title="تعديل الطابور"
                    initial={{
                      name: q.name,
                      status: q.status,
                      maxCapacity: q.maxCapacity,
                      avgServiceTime: q.avgServiceTime,
                    }}
                    submitLabel="حفظ"
                    onCancel={() => setEditing(null)}
                    onSubmit={async (values) => {
                      try {
                        await onPatch(q.id, values);
                      } catch (err) {
                        onToast(
                          "error",
                          "تعذّر الحفظ",
                          err instanceof Error ? err.message : undefined,
                        );
                      }
                    }}
                  />
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{q.name}</span>
                        <Badge
                          variant={
                            q.status === QUEUE_STATUS.active
                              ? "default"
                              : q.status === QUEUE_STATUS.paused
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {QUEUE_STATUS_AR[q.status]}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        السعة: {q.maxCapacity} · متوسط الخدمة:{" "}
                        {q.avgServiceTime} د
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(q)}
                        className="gap-1.5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(q)}
                        className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        حذف
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface QueueFormValues {
  name: string;
  status: QueueStatus;
  maxCapacity: number;
  avgServiceTime: number;
}

interface QueueFormCardProps {
  title: string;
  initial: QueueFormValues;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (values: QueueFormValues) => Promise<void>;
}

function QueueFormCard({
  title,
  initial,
  submitLabel,
  onCancel,
  onSubmit,
}: QueueFormCardProps) {
  const [values, setValues] = useState<QueueFormValues>(initial);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        status: values.status,
        maxCapacity: Number(values.maxCapacity) || 0,
        avgServiceTime: Number(values.avgServiceTime) || 0,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-4"
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="q-name">اسم الطابور</Label>
          <Input
            id="q-name"
            value={values.name}
            onChange={(e) =>
              setValues((p) => ({ ...p, name: e.target.value }))
            }
            required
            minLength={2}
            maxLength={80}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="q-status">الحالة</Label>
          <select
            id="q-status"
            value={values.status}
            onChange={(e) =>
              setValues((p) => ({
                ...p,
                status: e.target.value as QueueStatus,
              }))
            }
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
          >
            <option value={QUEUE_STATUS.active}>
              {QUEUE_STATUS_AR.active}
            </option>
            <option value={QUEUE_STATUS.paused}>
              {QUEUE_STATUS_AR.paused}
            </option>
            <option value={QUEUE_STATUS.closed}>
              {QUEUE_STATUS_AR.closed}
            </option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="q-capacity">السعة القصوى</Label>
          <Input
            id="q-capacity"
            type="number"
            min={1}
            max={500}
            value={values.maxCapacity}
            onChange={(e) =>
              setValues((p) => ({
                ...p,
                maxCapacity: Number(e.target.value),
              }))
            }
            required
            inputMode="numeric"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="q-avg">متوسط زمن الخدمة (دقائق)</Label>
          <Input
            id="q-avg"
            type="number"
            min={1}
            max={240}
            value={values.avgServiceTime}
            onChange={(e) =>
              setValues((p) => ({
                ...p,
                avgServiceTime: Number(e.target.value),
              }))
            }
            required
            inputMode="numeric"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={submitting}
        >
          إلغاء
        </Button>
        <Button type="submit" size="sm" disabled={submitting} className="gap-2">
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
