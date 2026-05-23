import Link from "next/link";
import { Home, Search } from "lucide-react";

export const metadata = {
  title: "الصفحة غير موجودة — دَوْرَك",
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-7xl font-bold text-primary/20">404</p>
        <h1 className="mt-4 text-2xl font-bold">لم نعثر على هذه الصفحة</h1>
        <p className="mt-2 text-muted-foreground">
          الرابط الذي اتّبعته قد يكون قديماً أو غير صحيح. تحقّق من العنوان أو
          عُد إلى الصفحة الرئيسية.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            الرئيسية
          </Link>
          <Link
            href="/dashboard/login"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Search className="h-4 w-4" />
            دخول لوحة التحكم
          </Link>
        </div>
      </div>
    </main>
  );
}
