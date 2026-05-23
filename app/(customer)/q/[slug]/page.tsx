import { notFound } from "next/navigation";
import Link from "next/link";
import { Store, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { type QueueStatus } from "@/lib/constants";
import { toArabicDigits } from "@/lib/utils";
import { ShopQueueList } from "@/components/customer/ShopQueueList";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug: string };
};

export default async function CustomerBusinessPage({ params }: PageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    include: {
      queues: {
        orderBy: { createdAt: "asc" },
        include: {
          _count: {
            select: {
              entries: { where: { status: "waiting" } },
            },
          },
        },
      },
    },
  });

  if (!business) notFound();

  const primaryColor = business.primaryColor || "#0F766E";
  const queues = business.queues.map((q) => ({
    id: q.id,
    name: q.name,
    status: q.status as QueueStatus,
    waitingCount: q._count.entries,
    avgServiceTime: q.avgServiceTime,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-accent/20">
      {/* Hero header with brand color */}
      <header
        className="relative overflow-hidden px-6 pt-12 pb-20 text-center text-white shadow-sm"
        style={{
          backgroundColor: primaryColor,
          backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10"
          aria-hidden
        />
        <div
          className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-white/5"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center">
          {business.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logo}
              alt={business.nameAr}
              className="h-20 w-20 rounded-2xl object-cover bg-white/90 p-1 shadow-lg ring-2 ring-white/40"
            />
          ) : (
            <div
              className="h-20 w-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30"
              aria-hidden
            >
              <Store className="h-10 w-10 text-white" />
            </div>
          )}
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            {business.nameAr}
          </h1>
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              dir="ltr"
              className="mt-3 inline-block text-sm opacity-90 underline-offset-4 hover:underline"
            >
              {toArabicDigits(business.phone)}
            </a>
          )}
        </div>
      </header>

      {/* Queue list, overlapping the hero */}
      <section className="container max-w-xl -mt-12 pb-10 relative z-10">
        <div className="mb-5 px-1">
          <h2 className="text-xl font-bold text-foreground">
            اختر الطابور للانضمام
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            اضغط على طابور نشط لتحجز دورك الآن.
          </p>
        </div>

        <ShopQueueList
          shopSlug={business.slug}
          primaryColor={primaryColor}
          queues={queues}
        />

        <div className="mt-6 text-center">
          <Link
            href={`/q/${business.slug}/recover`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="h-4 w-4" />
            عندي تذكرة سابقة — استرجاعها
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          مدعوم بواسطة{" "}
          <span className="font-semibold text-foreground">دَوْرَك</span>
        </p>
      </section>
    </main>
  );
}
