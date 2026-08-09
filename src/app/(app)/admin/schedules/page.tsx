import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { dayNameAr } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAYS_ORDER = [6, 0, 1, 2, 3, 4, 5]; // Sat first (Egypt week)

export default async function SchedulesPage() {
  const schedules = await prisma.schedule.findMany({
    include: {
      group: {
        include: {
          teacher: { include: { user: { select: { fullName: true } } } },
          students: { select: { id: true } },
        },
      },
    },
  });

  const byDay = new Map<number, typeof schedules>();
  for (const s of schedules) {
    if (!byDay.has(s.dayOfWeek)) byDay.set(s.dayOfWeek, []);
    byDay.get(s.dayOfWeek)!.push(s);
  }
  for (const arr of byDay.values()) arr.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div>
      <PageHeader
        title="الجداول"
        description="عرض إجمالي للحلقات مقسّمة حسب اليوم."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DAYS_ORDER.map((d) => {
          const items = byDay.get(d) ?? [];
          return (
            <div key={d} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 font-semibold text-primary">{dayNameAr(d)}</div>
              <div className="space-y-2">
                {items.length === 0 && <div className="text-xs text-muted-foreground">لا توجد حصص</div>}
                {items.map((s) => (
                  <div key={s.id} className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.group.name}</span>
                      <span dir="ltr" className="text-xs text-muted-foreground">{s.startTime}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {s.group.teacher?.user.fullName ?? "بدون معلمة"} — {s.group.students.length} طالبة
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
