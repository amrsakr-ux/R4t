import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, Users, ClipboardList, ExternalLink, PlayCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getTeacherIdForSession } from "@/lib/teacher-auth";
import { currentAcademicYear } from "@/lib/academic-year";
import { dayNameAr } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const PROVIDER_LABELS: Record<string, string> = {
  google_meet: "Google Meet", zoom: "Zoom", discord: "Discord", teams: "Teams", other: "لقاء",
};

export default async function TeacherDashboard() {
  const session = await getSession();
  if (!session || session.role !== "teacher") redirect("/login");
  const teacherId = await getTeacherIdForSession();
  if (!teacherId) redirect("/login");

  const year = currentAcademicYear();
  const today = new Date();
  const dow = today.getDay();

  const groups = await prisma.group.findMany({
    where: { teacherId, isActive: true },
    include: {
      schedules: true,
      enrollments: { where: { academicYear: year, status: "active" }, select: { id: true } },
    },
  });

  const totalStudents = groups.reduce((s, g) => s + g.enrollments.length, 0);
  const groupIds = groups.map((g) => g.id);

  const todaySlots = groups
    .flatMap((g) => g.schedules.filter((s) => s.dayOfWeek === dow).map((s) => ({ group: g, slot: s })))
    .sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));

  const upcoming = groups
    .flatMap((g) => g.schedules.filter((s) => s.dayOfWeek !== dow).map((s) => ({ group: g, slot: s })))
    .sort((a, b) => a.slot.dayOfWeek - b.slot.dayOfWeek || a.slot.startTime.localeCompare(b.slot.startTime))
    .slice(0, 5);

  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0);
  const [weekLessons, weekAttendance] = await Promise.all([
    prisma.lesson.count({ where: { groupId: { in: groupIds }, scheduledAt: { gte: weekStart } } }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { lesson: { groupId: { in: groupIds }, scheduledAt: { gte: weekStart } } },
      _count: true,
    }),
  ]);
  const attCount = (s: string) => weekAttendance.find((a) => a.status === s)?._count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">أهلًا يا {session.fullName.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">حصص اليوم ({dayNameAr(dow)}) ومهامكِ.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Users />} label="إجمالي الطالبات" value={totalStudents} />
        <Stat icon={<BookOpenIcon />} label="حلقاتي" value={groups.length} />
        <Stat icon={<ClipboardList />} label="حصص الأسبوع" value={weekLessons} />
        <Stat icon={<Calendar />} label="حضور الأسبوع" value={`${attCount("present")}/${attCount("present")+attCount("absent")+attCount("late")+attCount("excused")}`} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-primary">حصص اليوم</h2>
        {todaySlots.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            لا توجد حصص اليوم.
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {todaySlots.map(({ group, slot }) => (
            <div key={slot.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-primary">{group.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {group.enrollments.length} طالبة • {PROVIDER_LABELS[group.meetingProvider]}
                  </div>
                </div>
                <div dir="ltr" className="rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent-foreground">
                  {slot.startTime}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.meetLink && (
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <a href={group.meetLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      دخول اللقاء
                    </a>
                  </Button>
                )}
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 gap-1.5">
                  <Link href={`/teacher/students?group=${group.id}`}>
                    <PlayCircle className="h-3.5 w-3.5" />
                    بدء التسميع
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-primary">الحصص القادمة</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {upcoming.map(({ group, slot }) => (
              <div key={slot.id} className="flex items-center justify-between border-b border-border/50 p-3 last:border-0">
                <div>
                  <div className="text-sm font-medium">{group.name}</div>
                  <div className="text-xs text-muted-foreground">{dayNameAr(slot.dayOfWeek)}</div>
                </div>
                <div dir="ltr" className="text-sm text-muted-foreground">{slot.startTime}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold text-primary">{value}</div>
    </div>
  );
}

function BookOpenIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
}
