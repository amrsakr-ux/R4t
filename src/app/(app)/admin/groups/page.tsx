import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { dayNameAr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const groups = await prisma.group.findMany({
    include: {
      teacher: { include: { user: { select: { fullName: true } } } },
      program: { select: { name: true } },
      students: { select: { id: true } },
      schedules: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="الحلقات"
        description={`إجمالي ${groups.length} حلقة`}
        actionHref="/admin/groups/new"
        actionLabel="إنشاء حلقة"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {groups.length === 0 && (
          <div className="col-span-2 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            لا توجد حلقات بعد. اضغطي "إنشاء حلقة" للبدء.
          </div>
        )}
        {groups.map((g) => (
          <div key={g.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="font-semibold text-primary">{g.name}</div>
                <div className="text-xs text-muted-foreground">{g.program?.name ?? "بدون برنامج"}</div>
              </div>
              <Link href={`/admin/groups/${g.id}`} className="text-sm text-primary hover:underline">تعديل</Link>
            </div>
            <div className="mb-3 text-sm">
              <span className="text-muted-foreground">المعلمة: </span>
              <span className="font-medium">{g.teacher?.user.fullName ?? "لم تُعيَّن"}</span>
            </div>
            <div className="mb-3 text-sm">
              <span className="text-muted-foreground">عدد الطالبات: </span>
              <span className="font-medium">{g.students.length} / {g.maxStudents}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {g.schedules.map((s) => (
                <span key={s.id} className="rounded-full bg-muted px-3 py-1 text-xs">
                  {dayNameAr(s.dayOfWeek)} — {s.startTime}
                </span>
              ))}
              {g.schedules.length === 0 && <span className="text-xs text-muted-foreground">لا توجد مواعيد</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
