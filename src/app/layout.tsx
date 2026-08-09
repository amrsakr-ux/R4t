import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "سَنَا | أكاديمية القرآن الكريم",
  description:
    "أكاديمية سَنَا لتحفيظ القرآن الكريم — حلقات أونلاين للطالبات والأطفال بإشراف معلمات متخصصات، ومتابعة مستمرة لخطة الحفظ والمراجعة.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${tajawal.variable} font-arabic bg-background text-foreground antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
