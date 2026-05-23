import Link from "next/link";
import {
  ArrowLeft,
  BellRing,
  Building2,
  Check,
  ChevronLeft,
  Clock,
  Hospital,
  LineChart,
  ListOrdered,
  QrCode,
  Scissors,
  Smartphone,
  Sparkles,
  Star,
  Store,
  UtensilsCrossed,
  Waves,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <SiteHeader />
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <Verticals />
      <FinalCta />
      <SiteFooter />
    </main>
  );
}

/* ---------------- Header ---------------- */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            د
          </span>
          <span>دَوْرَك</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition-colors">
            كيف يعمل
          </a>
          <a
            href="#features"
            className="hover:text-foreground transition-colors"
          >
            المزايا
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            الأسعار
          </a>
          <a
            href="#verticals"
            className="hover:text-foreground transition-colors"
          >
            القطاعات
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">تسجيل الدخول</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard">
              ابدأ مجاناً
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative background */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/60 via-background to-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
      >
        <div className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-40 -left-24 h-[360px] w-[360px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 right-1/3 h-[260px] w-[260px] rounded-full bg-success/10 blur-3xl" />
      </div>
      {/* Subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="container relative pt-16 md:pt-24 pb-20 md:pb-28 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          نظام قوائم انتظار رقمي عربي أصيل
        </span>

        <h1 className="mt-6 text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
          ودّع الطوابير.
          <br />
          رحّب بـ{" "}
          <span className="relative inline-block">
            <span className="relative z-10 bg-gradient-to-l from-primary to-teal-500 bg-clip-text text-transparent">
              دَوْرَك
            </span>
            <span
              aria-hidden
              className="absolute bottom-1 right-0 left-0 -z-0 h-3 rounded-full bg-primary/20"
            />
          </span>
          .
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-base md:text-xl text-muted-foreground leading-relaxed">
          نظام ذكي يتيح لزبائنك حجز دورهم عن بُعد عبر رمز QR، ومتابعة موقعهم في
          الطابور لحظة بلحظة — دون تطبيقات، دون تسجيل، بتصميم عربي يمين-يسار.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="xl" className="gap-2 shadow-lg shadow-primary/20">
            <Link href="/dashboard">
              جرّب كصاحب محل
              <ArrowLeft className="h-4 w-4 rtl-mirror" />
            </Link>
          </Button>
          <Button asChild size="xl" variant="outline">
            <Link href="/q/salon-al-amir">جرّب كزبون</Link>
          </Button>
        </div>

        <div className="mt-8 text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-4 w-4 text-success" />
            بدون تطبيقات
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-4 w-4 text-success" />
            إعداد في دقائق
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-4 w-4 text-success" />
            تجربة مجانية
          </span>
        </div>

        {/* Hero visual */}
        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mt-16 mx-auto max-w-4xl">
      <div className="absolute inset-0 -z-10 translate-y-6 scale-95 rounded-3xl bg-gradient-to-l from-primary/30 to-primary/5 blur-2xl" />
      <div className="grid gap-4 md:grid-cols-3 rounded-3xl border bg-card/80 p-4 md:p-6 shadow-xl backdrop-blur">
        <MiniStat
          icon={<ListOrdered className="h-5 w-5" />}
          value="٤٢"
          label="زبون في الطابور"
          tone="primary"
        />
        <MiniStat
          icon={<Clock className="h-5 w-5" />}
          value="~٨ د"
          label="متوسط الانتظار"
          tone="success"
        />
        <MiniStat
          icon={<Star className="h-5 w-5" />}
          value="٤.٩"
          label="تقييم الزبائن"
          tone="warning"
        />
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tone: "primary" | "success" | "warning";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-background p-4">
      <div
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-xl",
          toneClass,
        )}
      >
        {icon}
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

/* ---------------- How It Works ---------------- */

function HowItWorks() {
  const steps = [
    {
      icon: QrCode,
      num: "١",
      title: "يمسح الزبون الرمز",
      desc: "كاميرا الهاتف تكفي. بلا تطبيقات، بلا إنشاء حساب — مجرد مسحة سريعة لفتح صفحة المحل.",
    },
    {
      icon: ListOrdered,
      num: "٢",
      title: "يأخذ رقمه ويتابع دوره",
      desc: "يختار الخدمة، يكتب اسمه، ويحصل على رقم تذكرته وموقعه في الطابور لحظة بلحظة.",
    },
    {
      icon: BellRing,
      num: "٣",
      title: "ينبّهه الهاتف حين يقترب دوره",
      desc: "إشعارات تلقائية عند اقتراب الدور وعند المناداة — يدخل المحل مرتاحاً دون طوابير.",
    },
  ];

  return (
    <section id="how" className="py-24 md:py-32 relative">
      <div className="container">
        <SectionHeader
          eyebrow="كيف يعمل"
          title="ثلاث خطوات بسيطة، تجربة بلا احتكاك"
          description="صُمم النظام ليعمل بأقل جهد من الزبون وصاحب المحل على حد سواء."
        />

        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          {/* Connector line */}
          <div
            aria-hidden
            className="absolute top-10 right-[16.6%] left-[16.6%] hidden md:block h-px bg-gradient-to-l from-primary/10 via-primary/40 to-primary/10"
          />
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="relative text-center">
                <div className="relative mx-auto inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <Icon className="h-9 w-9" />
                  <span className="absolute -top-2 -right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background text-primary text-sm font-bold border-2 border-primary tabular-nums">
                    {s.num}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Features ---------------- */

function Features() {
  const features = [
    {
      icon: QrCode,
      title: "رمز QR لكل محل",
      desc: "طباعة واحدة وتعليقه في المحل. يدخل الزبون الطابور دون تطبيق ودون تسجيل.",
    },
    {
      icon: Clock,
      title: "تحديث لحظي للموقع",
      desc: "بث مباشر لكل شاشة: الزبون يرى موقعه، والمحل يرى الطابور كاملاً.",
    },
    {
      icon: BellRing,
      title: "تنبيهات ذكية",
      desc: "إشعارات عبر المتصفح تصل للزبون حين يقترب دوره، دون الحاجة لاتصال.",
    },
    {
      icon: LineChart,
      title: "لوحة تحكم شاملة",
      desc: "إحصائيات يومية، سجل العملاء، إدارة الطوابير، ومناداة الزبائن بلمسة واحدة.",
    },
    {
      icon: Smartphone,
      title: "تجربة mobile-first",
      desc: "واجهة متجاوبة عربية من اليمين إلى اليسار، تعمل بسلاسة على كل هاتف.",
    },
    {
      icon: Zap,
      title: "إعداد سريع",
      desc: "ابدأ خلال دقائق: أضف محلك، أنشئ طابوراً، اطبع الرمز — وانطلق.",
    },
  ];

  return (
    <section id="features" className="py-24 md:py-32 bg-muted/30 border-y">
      <div className="container">
        <SectionHeader
          eyebrow="المزايا"
          title="كل ما تحتاجه لإدارة الطوابير، في مكان واحد"
          description="أدوات مدروسة تجعل الانتظار تجربة مريحة لزبائنك، ومنظمة لفريقك."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative rounded-2xl border bg-background p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-primary/30"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Pricing ---------------- */

function Pricing() {
  const plans = [
    {
      name: "مجاني",
      price: "٠",
      currency: "ريال",
      period: "للأبد",
      description: "ابدأ دون أي التزام. مناسب للمحلات الصغيرة.",
      features: [
        "طابور واحد",
        "حتى ٢٠ زبون/يوم",
        "رمز QR جاهز للطباعة",
        "إحصائيات أساسية",
      ],
      cta: "ابدأ مجاناً",
      highlighted: false,
    },
    {
      name: "احترافي",
      price: "٢٩",
      currency: "ريال",
      period: "شهرياً",
      description: "للمحلات النشطة التي تريد تجربة أكمل.",
      features: [
        "طوابير غير محدودة",
        "زبائن غير محدودون",
        "تنبيهات ذكية للزبائن",
        "سجل تفصيلي للعملاء",
        "تخصيص شعار ولون المحل",
        "دعم فني خلال ٢٤ ساعة",
      ],
      cta: "ابدأ النسخة الاحترافية",
      highlighted: true,
      badge: "الأكثر شهرة",
    },
    {
      name: "الأعمال",
      price: "٩٩",
      currency: "ريال",
      period: "شهرياً",
      description: "لسلاسل المحلات والفرق الكبيرة.",
      features: [
        "كل ميزات الاحترافي",
        "فروع متعددة",
        "حسابات موظفين",
        "تقارير مُصدَّرة (CSV/PDF)",
        "ربط API للأنظمة الأخرى",
        "دعم فني مخصص",
      ],
      cta: "تواصل مع المبيعات",
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="container">
        <SectionHeader
          eyebrow="الأسعار"
          title="أسعار واضحة. ابدأ مجاناً، وسِّع متى شئت"
          description="بدون رسوم خفية. بدون عقود. ألغِ متى تشاء."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3 items-stretch">
          {plans.map((p) => (
            <div
              key={p.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-background p-6 md:p-8 transition-all",
                p.highlighted
                  ? "border-primary shadow-2xl shadow-primary/10 lg:scale-[1.03] ring-1 ring-primary/30"
                  : "hover:border-foreground/20 hover:shadow-lg",
              )}
            >
              {p.highlighted && p.badge && (
                <span className="absolute -top-3 right-1/2 translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                  <Sparkles className="h-3 w-3" />
                  {p.badge}
                </span>
              )}

              <div>
                <h3
                  className={cn(
                    "text-lg font-bold",
                    p.highlighted && "text-primary",
                  )}
                >
                  {p.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed min-h-[3rem]">
                  {p.description}
                </p>
              </div>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight tabular-nums">
                  {p.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {p.currency} / {p.period}
                </span>
              </div>

              <ul className="mt-6 space-y-3 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        p.highlighted
                          ? "bg-primary text-primary-foreground"
                          : "bg-success/15 text-success",
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                variant={p.highlighted ? "default" : "outline"}
                className="mt-8 w-full"
              >
                <Link href="/dashboard">{p.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Verticals ---------------- */

function Verticals() {
  const items = [
    { icon: Scissors, label: "صالونات الحلاقة" },
    { icon: UtensilsCrossed, label: "المطاعم" },
    { icon: Hospital, label: "العيادات" },
    { icon: Waves, label: "المغاسل" },
    { icon: Sparkles, label: "صالونات التجميل" },
    { icon: Wrench, label: "ورش الصيانة" },
  ];

  return (
    <section id="verticals" className="py-24 md:py-32 bg-muted/30 border-y">
      <div className="container">
        <SectionHeader
          eyebrow="لمن هو النظام"
          title="مناسب لكل محل خدمي"
          description="من صالون الحلاقة في الحي إلى العيادات وورش الصيانة — دَوْرَك يتكيف مع نشاطك."
        />

        <div className="mt-14 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {items.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.label}
                className="group flex flex-col items-center gap-3 rounded-2xl border bg-background p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-colors group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="text-sm font-semibold">{v.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */

function FinalCta() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary via-primary to-teal-600 p-10 md:p-16 text-primary-foreground shadow-2xl shadow-primary/30">
          <div
            aria-hidden
            className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
              <Sparkles className="h-4 w-4" />
              جاهز تبدأ؟
            </div>
            <h2 className="mt-6 text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              حوّل محلك إلى تجربة بلا طوابير اليوم
            </h2>
            <p className="mt-4 text-base md:text-lg text-white/85 leading-relaxed">
              جرّب دَوْرَك مجاناً. لا يحتاج فريقك لأي تدريب، ولا يحتاج زبائنك
              لأي تطبيق.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                size="xl"
                variant="secondary"
                className="gap-2 bg-white text-primary hover:bg-white/90"
              >
                <Link href="/dashboard">
                  ابدأ الآن مجاناً
                  <ArrowLeft className="h-4 w-4 rtl-mirror" />
                </Link>
              </Button>
              <Button
                asChild
                size="xl"
                variant="outline"
                className="gap-2 bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/q/salon-al-amir">شاهد تجربة زبون</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */

function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                د
              </span>
              <span>دَوْرَك</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-sm">
              نظام قوائم انتظار رقمية، مُصمم للعالم العربي أولاً. يريحك من
              ازدحام المحل ويُسعد زبائنك.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold mb-3">المنتج</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground">
                  المزايا
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-foreground">
                  الأسعار
                </a>
              </li>
              <li>
                <a href="#how" className="hover:text-foreground">
                  كيف يعمل
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  لوحة التحكم
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold mb-3">لمن</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Scissors className="h-3.5 w-3.5" />
                صالونات الحلاقة
              </li>
              <li className="flex items-center gap-2">
                <UtensilsCrossed className="h-3.5 w-3.5" />
                المطاعم
              </li>
              <li className="flex items-center gap-2">
                <Hospital className="h-3.5 w-3.5" />
                العيادات
              </li>
              <li className="flex items-center gap-2">
                <Store className="h-3.5 w-3.5" />
                المحلات الخدمية
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} دَوْرَك — صُنع بحب للعالم العربي.</div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              الخصوصية
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              الشروط
            </Link>
            <a href="#" className="hover:text-foreground">
              تواصل معنا
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- Shared section header ---------------- */

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-primary">
        <Building2 className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
        {title}
      </h2>
      <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
