"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBusinessSession } from "@/lib/hooks/use-business-session";

interface DashboardShellProps {
  businessName: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/history", label: "السجل", icon: History, exact: false },
  { href: "/dashboard/qr", label: "رمز QR", icon: QrCode, exact: false },
  {
    href: "/dashboard/settings",
    label: "الإعدادات",
    icon: Settings,
    exact: false,
  },
];

export function DashboardShell({ businessName, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useBusinessSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    router.replace("/dashboard/login");
  };

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex md:w-64 flex-col border-l bg-background">
        <div className="flex h-16 items-center gap-2 border-b px-6 font-bold text-lg">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            د
          </span>
          دَوْرَك
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-64 bg-background border-l flex flex-col md:hidden transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4 font-bold text-lg">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              د
            </span>
            دَوْرَك
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-muted-foreground"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-background flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-muted-foreground"
              onClick={() => setMobileOpen(true)}
              aria-label="القائمة"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="text-xs text-muted-foreground">المحل</div>
              <div className="text-sm font-semibold">{businessName}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2 md:hidden"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">تسجيل الخروج</span>
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
