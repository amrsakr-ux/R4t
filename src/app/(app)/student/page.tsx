import { getSession } from "@/lib/auth";
import { BookOpen, Calendar, CheckCircle2 } from "lucide-react";

export default async function StudentDashboard() {
  const session = await getSession();
  const name = session?.fullName.split(" ")[0] ?? "طالبتنا";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">السلام عليكِ يا {name}</h1>
        <p className="text-muted-foreground">هذه لوحتكِ لمتابعة حصصكِ وخطة الحفظ.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card icon={<Calendar className="h-5 w-5" />} title="حصة اليوم" subtitle="السبت — 6:00 ص" />
        <Card icon={<BookOpen className="h-5 w-5" />} title="خطة الحفظ" subtitle="آل عمران — 80%" />
        <Card icon={<CheckCircle2 className="h-5 w-5" />} title="حالة الاشتراك" subtitle="مدفوع لهذا الشهر" ok />
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        باقي شاشات الطالبة (الجدول، خطة الحفظ، سجل التسميع، المدفوعات) قيد الإنشاء.
      </div>
    </div>
  );
}

function Card({ icon, title, subtitle, ok }: { icon: React.ReactNode; title: string; subtitle: string; ok?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${ok ? "bg-secondary/20 text-secondary" : "bg-primary/10 text-primary"}`}>
        {icon}
      </div>
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="font-semibold">{subtitle}</div>
    </div>
  );
}
