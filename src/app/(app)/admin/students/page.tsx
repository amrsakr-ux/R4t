import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = await prisma.student.findMany({
    include: {
      user: { select: { fullName: true, email: true, phone: true, isActive: true } },
      program: { select: { name: true } },
      group: { select: { name: true } },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="الطالبات"
        description={`إجمالي ${students.length} طالبة`}
        actionHref="/admin/students/new"
        actionLabel="إضافة طالبة"
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-right text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">الاسم</th>
              <th className="p-3">البريد</th>
              <th className="p-3">البرنامج</th>
              <th className="p-3">الحلقة</th>
              <th className="p-3">الحالة</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  لا توجد طالبات بعد. اضغطي "إضافة طالبة" للبدء.
                </td>
              </tr>
            )}
            {students.map((s) => (
              <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                <td className="p-3 font-medium">{s.user.fullName}</td>
                <td className="p-3 text-muted-foreground" dir="ltr">{s.user.email}</td>
                <td className="p-3">{s.program?.name ?? "—"}</td>
                <td className="p-3">{s.group?.name ?? "—"}</td>
                <td className="p-3">
                  {s.user.isActive ? (
                    <Badge className="bg-secondary/20 text-secondary hover:bg-secondary/20">نشطة</Badge>
                  ) : (
                    <Badge variant="secondary">موقوفة</Badge>
                  )}
                </td>
                <td className="p-3 text-left">
                  <Link href={`/admin/students/${s.id}`} className="text-primary hover:underline">
                    عرض
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
