"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    ownerName: "",
    email: "",
    password: "",
    businessNameAr: "",
    businessName: "",
    slug: "",
    phone: "",
    timezone: "Asia/Riyadh",
    primaryColor: "#0F766E",
  });

  const update = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const slugify = (input: string) =>
    input
      .toLowerCase()
      .replace(/[^a-z0-9-\s]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "تعذّر إنشاء الحساب");
        setSubmitting(false);
        return;
      }

      const signed = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (!signed || signed.error) {
        // Account created but auto-login failed; send them to login.
        router.replace("/dashboard/login");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("حدث خطأ أثناء إرسال النموذج");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-accent/40 via-background to-background flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-xl">
        <Link
          href="/dashboard/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 rtl-mirror" />
          عندي حساب
        </Link>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold">
              د
            </div>
            <CardTitle className="text-2xl">سجّل محلك مجاناً</CardTitle>
            <CardDescription>
              ابدأ باستقبال الزبائن عبر قائمة انتظار رقمية خلال دقيقة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold mb-1">
                  بيانات صاحب المحل
                </legend>
                <Field
                  label="اسمك (اختياري)"
                  id="ownerName"
                  value={form.ownerName}
                  onChange={(v) => update("ownerName", v)}
                  placeholder="مثلاً: محمد علي"
                />
                <Field
                  label="البريد الإلكتروني"
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(v) => update("email", v)}
                  placeholder="you@example.com"
                  ltr
                />
                <Field
                  label="كلمة المرور (8 أحرف فأكثر)"
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(v) => update("password", v)}
                  placeholder="••••••••"
                  ltr
                />
              </fieldset>

              <fieldset className="space-y-3 pt-2 border-t">
                <legend className="text-sm font-semibold mb-1">
                  بيانات المحل
                </legend>
                <Field
                  label="اسم المحل بالعربية"
                  id="businessNameAr"
                  required
                  value={form.businessNameAr}
                  onChange={(v) => {
                    update("businessNameAr", v);
                    if (!form.slug) update("slug", slugify(v));
                  }}
                  placeholder="صالون الأمير"
                />
                <Field
                  label="الاسم بالإنجليزية"
                  id="businessName"
                  required
                  value={form.businessName}
                  onChange={(v) => update("businessName", v)}
                  placeholder="Salon Al-Amir"
                  ltr
                />
                <div className="space-y-1.5">
                  <label htmlFor="slug" className="text-sm font-medium">
                    رابط المحل (slug)
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-xs text-muted-foreground" dir="ltr">
                      /q/
                    </span>
                    <input
                      id="slug"
                      required
                      pattern="^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
                      minLength={3}
                      maxLength={40}
                      value={form.slug}
                      onChange={(e) => update("slug", slugify(e.target.value))}
                      className="h-11 flex-1 rounded-l-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="salon-al-amir"
                      dir="ltr"
                    />
                  </div>
                </div>
                <Field
                  label="رقم الهاتف (اختياري)"
                  id="phone"
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                  placeholder="+966 5 ..."
                  ltr
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="timezone" className="text-sm font-medium">
                      المنطقة الزمنية
                    </label>
                    <select
                      id="timezone"
                      value={form.timezone}
                      onChange={(e) => update("timezone", e.target.value)}
                      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="Asia/Riyadh">الرياض / مكة</option>
                      <option value="Asia/Dubai">دبي / أبوظبي</option>
                      <option value="Asia/Qatar">الدوحة</option>
                      <option value="Asia/Kuwait">الكويت</option>
                      <option value="Asia/Bahrain">المنامة</option>
                      <option value="Africa/Cairo">القاهرة</option>
                      <option value="Asia/Hebron">القدس / الخليل</option>
                      <option value="Africa/Casablanca">الدار البيضاء</option>
                      <option value="Africa/Tunis">تونس</option>
                      <option value="Africa/Algiers">الجزائر</option>
                      <option value="Asia/Amman">عمّان</option>
                      <option value="Asia/Beirut">بيروت</option>
                      <option value="Asia/Baghdad">بغداد</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="primaryColor" className="text-sm font-medium">
                      اللون الرئيسي
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="primaryColor"
                        type="color"
                        value={form.primaryColor}
                        onChange={(e) => update("primaryColor", e.target.value)}
                        className="h-11 w-12 rounded-md border border-input bg-background"
                      />
                      <input
                        type="text"
                        value={form.primaryColor}
                        onChange={(e) => update("primaryColor", e.target.value)}
                        pattern="^#[0-9a-fA-F]{6}$"
                        className="h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </fieldset>

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
                إنشاء الحساب وفتح اللوحة
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  minLength,
  ltr,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  ltr?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={ltr ? "ltr" : undefined}
        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
