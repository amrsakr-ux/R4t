import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTeacherIdForSession } from "@/lib/teacher-auth";
import { currentAcademicYear } from "@/lib/academic-year";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string }>;
}) {
  const teacherId = await getTeacherIdForSession();
  if (!teacherId) redirect("/login");
  const { q, group: groupFilter } = await searchParams;
  const year = currentAcademicYear();
  const search = (q ?? "").trim();

  const groups = await prisma.group.findMany({
    where: { teacherId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: {
      academicYear: year,
      status: "active",
      group: { teacherId },
      ...(groupFilter ? { groupId: groupFilter } : {}),
      ...(search
        ? { student: { user: { OR: [{ fullName: { contains: search, mode: "insensitive" } }, { username: { contains: search, mode: "insensitive" } }] } } }
        : {}),
    },
    include: {
      student: { include: { user: { select: { fullName: true, username: true, avatarUrl: true } }, memorizationPlan: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: [{ group: { name: "asc" } }, { student: { user: { fullName: "asc" } } }],
  });

  const groupedByGroup = new Map<string, typeof enrollments>();
  for (const e of enrollments) {
    const key = e.group?.id ?? "no-group";
    if (!groupedByGroup.has(key)) groupedByGroup.set(key, []);
    groupedByGroup.get(key)!.push(e);
  }

  return (
    <div>
      <PageHeader title="طالباتي" description={`${enrollments.length} طالبة نشطة`} />

      <form action="/teacher/students" method="GET" className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={search} placeholder="ابحثي بالاسم..." className="pe-9" />
        </div>
        <select name="group" defaultValue={groupFilter ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">كل الحلقات</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </form>

      {enrollments.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          لا توجد طالبات نشطات مطابقات للفلتر.
        </div>
      )}

      <div className="space-y-6">
        {Array.from(groupedByGroup.entries()).map(([, items]) => (
          <div key={items[0]?.group?.id}>
            <div className="mb-2 text-sm font-semibold text-primary">{items[0]?.group?.name}</div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((e) => (
                <Link
                  key={e.id}
                  href={`/teacher/students/${e.student.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-accent/50 hover:shadow-sm"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{e.student.user.fullName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {e.student.memorizationPlan?.currentSurah ?? "لم تُحدد الخطة"}
                    </div>
                  </div>
                  {e.student.memorizationPlan && (
                    <div className="text-xs font-medium text-secondary">
                      {e.student.memorizationPlan.progressPct}%
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
