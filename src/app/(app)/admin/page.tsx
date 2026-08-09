import { Users, GraduationCap, BookOpen, Calendar } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">لوحة الإدارة</h1>
        <p className="text-muted-foreground">نظرة عامة على الأكاديمية.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={<Users />} label="الطالبات" value="—" />
        <Stat icon={<GraduationCap />} label="المعلمات" value="—" />
        <Stat icon={<BookOpen />} label="الحلقات" value="—" />
        <Stat icon={<Calendar />} label="حصص هذا الأسبوع" value="—" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        صفحات الإدارة (الطالبات، المعلمات، الحلقات، الجداول، المدفوعات) قيد الإنشاء.
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-primary">{value}</div>
    </div>
  );
}
