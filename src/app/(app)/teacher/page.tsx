import { getSession } from "@/lib/auth";
import { Users, Calendar, ClipboardList } from "lucide-react";

export default async function TeacherDashboard() {
  const session = await getSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">لوحة المعلمة</h1>
        <p className="text-muted-foreground">أهلًا بكِ يا {session?.fullName}.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card icon={<Calendar />} title="حصص اليوم" value="—" />
        <Card icon={<Users />} title="طالباتي" value="—" />
        <Card icon={<ClipboardList />} title="حصص بحاجة تقييم" value="—" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        شاشات المعلمة (قائمة الطالبات، تسجيل الحصة، التقييم) قيد الإنشاء.
      </div>
    </div>
  );
}

function Card({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold text-primary">{value}</div>
    </div>
  );
}
