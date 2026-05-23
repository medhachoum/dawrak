import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "دَوْرَك — قوائم انتظار رقمية لمحلاتك",
    template: "%s | دَوْرَك",
  },
  description:
    "نظام قوائم انتظار رقمية للمحلات الخدمية. احجز دورك من هاتفك، وتابع موقعك في الطابور لحظة بلحظة.",
  keywords: [
    "دورك",
    "Dawrak",
    "طابور",
    "قائمة انتظار",
    "حجز دور",
    "حلاق",
    "مطعم",
    "عيادة",
  ],
  applicationName: "دَوْرَك",
  authors: [{ name: "Dawrak" }],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0F766E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={arabic.variable}>
      <body className="min-h-screen bg-background text-foreground font-arabic">
        {children}
      </body>
    </html>
  );
}
