import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getSession, DASHBOARD_ROUTES } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await getSession();
  const { callbackUrl, error } = await searchParams;
  if (session) {
    redirect(callbackUrl || DASHBOARD_ROUTES[session.role]);
  }

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="relative hidden bg-primary p-12 text-primary-foreground md:flex md:flex-col md:justify-between">
        <div className="absolute inset-0 bg-pattern opacity-10" />
        <Link href="/" className="relative flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-foreground/15">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold">سَنَا</div>
            <div className="text-xs opacity-80">أكاديمية القرآن الكريم</div>
          </div>
        </Link>
        <div className="relative">
          <blockquote className="mb-4 text-2xl font-medium leading-relaxed">
            «خيركم من تعلّم القرآن وعلّمه»
          </blockquote>
          <div className="text-sm opacity-80">— حديث شريف</div>
        </div>
        <div className="relative text-xs opacity-70">
          © {new Date().getFullYear()} أكاديمية سَنَا
        </div>
      </section>

      <section className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold text-primary">أهلًا بكِ من جديد</h1>
            <p className="text-sm text-muted-foreground">سجّلي الدخول لمتابعة رحلتكِ في الحفظ</p>
          </div>
          <LoginForm callbackUrl={callbackUrl} initialError={error} />
          <div className="mt-6 text-center text-sm text-muted-foreground">
            ليس لديكِ حساب؟{" "}
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              تواصلي معنا للتسجيل
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
