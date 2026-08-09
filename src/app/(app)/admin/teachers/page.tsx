import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({
    include: {
      user: { select: { fullName: true, email: true, phone: true, isActive: true } },
      groups: { select: { id: true, name: true, students: { select: { id: true } } } },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="المعلمات"
        description={`إجمالي ${teachers.length} معلمة`}
        actionHref="/admin/teachers/new"
        actionLabel="إضافة معلمة"
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-right text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">الاسم</th>
              <th className="p-3">البريد</th>
              <th className="p-3">الحلقات</th>
              <th className="p-3">إجمالي الطالبات</th>
              <th className="p-3">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  لا توجد معلمات بعد.
                </td>
              </tr>
            )}
            {teachers.map((t) => {
              const totalStudents = t.groups.reduce((sum, g) => sum + g.students.length, 0);
              return (
                <tr key={t.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{t.user.fullName}</td>
                  <td className="p-3 text-muted-foreground" dir="ltr">{t.user.email}</td>
                  <td className="p-3">{t.groups.length}</td>
                  <td className="p-3">{totalStudents}</td>
                  <td className="p-3">
                    {t.user.isActive ? (
                      <Badge className="bg-secondary/20 text-secondary hover:bg-secondary/20">نشطة</Badge>
                    ) : (
                      <Badge variant="secondary">موقوفة</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
