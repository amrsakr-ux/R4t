import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center p-8">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="mb-3 text-xl font-bold text-primary">نسيتِ كلمة المرور؟</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          تواصلي مع إدارة الأكاديمية عبر واتساب لإعادة تعيين كلمة المرور.
        </p>
        <Button asChild className="w-full bg-primary hover:bg-primary/90">
          <a href="https://wa.me/201000000000" target="_blank" rel="noopener noreferrer">
            تواصل عبر واتساب
          </a>
        </Button>
        <div className="mt-4 text-sm">
          <Link href="/login" className="text-primary hover:underline">العودة لتسجيل الدخول</Link>
        </div>
      </div>
    </main>
  );
}
