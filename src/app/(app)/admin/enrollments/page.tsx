import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDateAr } from "@/lib/utils";
import { currentAcademicYear, academicYearOptions } from "@/lib/academic-year";

export const dynamic = "force-dynamic";

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const selected = params.year ?? currentAcademicYear();
  const years = academicYearOptions(3);

  const enrollments = await prisma.enrollment.findMany({
    where: { academicYear: selected },
    include: {
      student: { include: { user: { select: { fullName: true, username: true } } } },
      program: { select: { name: true } },
      group: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="التسجيلات السنوية"
        description={`عرض تسجيلات الطالبات لكل عام دراسي — ${enrollments.length} تسجيل`}
        actionHref="/admin/students/new"
        actionLabel="تسجيل طالبة"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {years.map((y) => (
          <a
            key={y}
            href={`/admin/enrollments?year=${y}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              y === selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-accent/50"
            }`}
          >
            {y}
          </a>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-right text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">الطالبة</th>
              <th className="p-3">اسم المستخدم</th>
              <th className="p-3">البرنامج</th>
              <th className="p-3">الحلقة</th>
              <th className="p-3">تاريخ البدء</th>
              <th className="p-3">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  لا يوجد تسجيلات لهذا العام.
                </td>
              </tr>
            )}
            {enrollments.map((e) => (
              <tr key={e.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                <td className="p-3 font-medium">{e.student.user.fullName}</td>
                <td className="p-3 text-muted-foreground" dir="ltr">{e.student.user.username}</td>
                <td className="p-3">{e.program?.name ?? "—"}</td>
                <td className="p-3">{e.group?.name ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{formatDateAr(e.startDate)}</td>
                <td className="p-3"><EnrollmentBadge status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EnrollmentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "نشطة", cls: "bg-secondary/20 text-secondary" },
    paused: { label: "موقوفة", cls: "bg-accent/20 text-accent-foreground" },
    completed: { label: "مكتملة", cls: "bg-primary/10 text-primary" },
    withdrawn: { label: "منسحبة", cls: "bg-muted text-muted-foreground" },
  };
  const s = map[status] ?? map.active;
  return <Badge className={`${s.cls} hover:${s.cls}`}>{s.label}</Badge>;
}
