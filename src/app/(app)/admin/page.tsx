import { Users, GraduationCap, BookOpen, Calendar, CreditCard, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { currentAcademicYear } from "@/lib/academic-year";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const year = currentAcademicYear();
  const [activeStudents, teachers, groups, weekLessons, pendingPayments] = await Promise.all([
    prisma.enrollment.count({ where: { academicYear: year, status: "active" } }),
    prisma.teacher.count(),
    prisma.group.count({ where: { isActive: true } }),
    prisma.lesson.count({
      where: {
        scheduledAt: { gte: startOfWeek(), lt: endOfWeek() },
      },
    }),
    prisma.payment.count({ where: { status: "pending" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">لوحة الإدارة</h1>
        <p className="text-muted-foreground">نظرة عامة على الأكاديمية — العام الدراسي {year}.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Stat icon={<Users />} label="الطالبات النشطات" value={activeStudents} />
        <Stat icon={<GraduationCap />} label="المعلمات" value={teachers} />
        <Stat icon={<BookOpen />} label="الحلقات" value={groups} />
        <Stat icon={<Calendar />} label="حصص هذا الأسبوع" value={weekLessons} />
        <Stat icon={<CreditCard />} label="مدفوعات معلقة" value={pendingPayments} highlight={pendingPayments > 0} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 text-accent" />
          روابط سريعة
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <QuickLink href="/admin/students/new" label="إضافة طالبة جديدة" />
          <QuickLink href="/admin/groups/new" label="إنشاء حلقة" />
          <QuickLink href="/admin/payments" label="مراجعة المدفوعات" />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-accent/40 bg-accent/5" : "border-border bg-card"}`}>
      <div className={`mb-2 grid h-9 w-9 place-items-center rounded-xl ${highlight ? "bg-accent/20 text-accent-foreground" : "bg-primary/10 text-primary"}`}>
        {icon}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-primary">{value}</div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm transition hover:border-accent/50 hover:bg-accent/5">
      {label} ←
    </a>
  );
}

function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfWeek() {
  const d = startOfWeek();
  d.setDate(d.getDate() + 7);
  return d;
}
