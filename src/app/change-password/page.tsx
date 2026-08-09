import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getSession, DASHBOARD_ROUTES } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-primary">سَنَا</div>
            <div className="text-[10px] text-muted-foreground">تغيير كلمة المرور</div>
          </div>
        </div>

        {session.mustChangePassword && (
          <div className="mb-5 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
            هذه أول مرة تسجّلين فيها الدخول. من فضلكِ اختاري كلمة مرور جديدة لحمايتكِ.
          </div>
        )}

        <ChangePasswordForm redirectTo={DASHBOARD_ROUTES[session.role]} />

        {!session.mustChangePassword && (
          <div className="mt-4 text-center text-sm">
            <Link href={DASHBOARD_ROUTES[session.role]} className="text-muted-foreground hover:text-primary">
              العودة للوحة التحكم
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
