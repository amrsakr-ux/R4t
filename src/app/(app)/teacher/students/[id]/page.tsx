import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, BookOpen, ClipboardList, Calendar, ExternalLink, PlayCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTeacherIdForSession, assertTeacherOwnsStudent } from "@/lib/teacher-auth";
import { currentAcademicYear } from "@/lib/academic-year";
import { formatDateAr } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickLessonForm } from "./quick-lesson-form";

export const dynamic = "force-dynamic";

const GRADE_LABEL: Record<string, string> = {
  excellent: "ممتاز", very_good: "جيد جدًا", good: "جيد", needs_review: "يحتاج مراجعة",
};
const ATT_LABEL: Record<string, string> = {
  present: "حضور", absent: "غياب", late: "متأخر", excused: "معذورة",
};

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const teacherId = await getTeacherIdForSession();
  if (!teacherId) redirect("/login");
  const { id } = await params;

  const authorized = await assertTeacherOwnsStudent(teacherId, id);
  if (!authorized) notFound();

  const year = currentAcademicYear();
  const [student, enrollment, recentLessons, attendanceStats] = await Promise.all([
    prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, username: true, phone: true } },
        memorizationPlan: true,
      },
    }),
    prisma.enrollment.findFirst({
      where: { studentId: id, academicYear: year, status: "active" },
      include: {
        program: { select: { name: true } },
        group: { select: { id: true, name: true, meetLink: true, meetingProvider: true } },
      },
    }),
    prisma.lesson.findMany({
      where: { studentId: id, group: { teacherId } },
      orderBy: { scheduledAt: "desc" },
      take: 6,
      include: { evaluation: true, attendance: true },
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { studentId: id, lesson: { group: { teacherId } } },
      _count: true,
    }),
  ]);

  if (!student || !enrollment) notFound();
  const plan = student.memorizationPlan;
  const attSummary = Object.fromEntries(attendanceStats.map((a) => [a.status, a._count]));
  const totalAtt = attendanceStats.reduce((s, a) => s + a._count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/teacher/students" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <ArrowRight className="h-3 w-3" />
            كل الطالبات
          </Link>
          <h1 className="text-2xl font-bold text-primary">{student.user.fullName}</h1>
          <div className="mt-1 text-xs text-muted-foreground">
            <span dir="ltr">{student.user.username}</span>
            {student.user.phone && <> • <span dir="ltr">{student.user.phone}</span></>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {enrollment.group?.meetLink && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={enrollment.group.meetLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                دخول اللقاء
              </a>
            </Button>
          )}
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 gap-1.5">
            <Link href={`/teacher/students/${id}/plan`}>
              <BookOpen className="h-3.5 w-3.5" />
              تعديل الخطة
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoCard label="البرنامج" value={enrollment.program?.name ?? "—"} />
        <InfoCard label="الحلقة" value={enrollment.group?.name ?? "—"} />
        <InfoCard label="نسبة الحضور" value={totalAtt > 0 ? `${Math.round((100 * (attSummary.present ?? 0)) / totalAtt)}%` : "—"} />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <BookOpen className="h-4 w-4" />
            خطة الحفظ الحالية
          </div>
          {plan && <div className="text-xs text-muted-foreground">{plan.progressPct}% من البرنامج</div>}
        </div>
        {plan ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <PlanBox label="الجديد" surah={plan.currentSurah} from={plan.currentAyahFrom} to={plan.currentAyahTo} />
            <PlanBox label="المراجعة" surah={plan.reviewSurah} from={plan.reviewAyahFrom} to={plan.reviewAyahTo} />
            {plan.notes && (
              <div className="sm:col-span-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                {plan.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">لم تُحدد خطة بعد. <Link href={`/teacher/students/${id}/plan`} className="text-primary hover:underline">أنشئي واحدة</Link>.</div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
          <PlayCircle className="h-4 w-4" />
          تسجيل حصة جديدة
        </h2>
        <QuickLessonForm studentId={id} groupId={enrollment.group!.id} />
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
          <ClipboardList className="h-4 w-4" />
          آخر الحصص
        </h2>
        {recentLessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            لم يتم تسجيل حصص بعد.
          </div>
        ) : (
          <div className="space-y-2">
            {recentLessons.map((l) => (
              <div key={l.id} className="rounded-xl border border-border bg-card p-3">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDateAr(l.scheduledAt)}</span>
                  <div className="flex items-center gap-2">
                    <StatusChip status={l.status} />
                    {l.evaluation && <Badge className="bg-accent/15 text-accent-foreground hover:bg-accent/15">{GRADE_LABEL[l.evaluation.memorization] ?? l.evaluation.memorization}</Badge>}
                  </div>
                </div>
                {(l.newPortion || l.reviewPortion) && (
                  <div className="text-sm">
                    {l.newPortion && <div><span className="text-muted-foreground text-xs">الجديد: </span>{l.newPortion}</div>}
                    {l.reviewPortion && <div><span className="text-muted-foreground text-xs">المراجعة: </span>{l.reviewPortion}</div>}
                  </div>
                )}
                {l.teacherNotes && <div className="mt-1 text-xs text-muted-foreground">{l.teacherNotes}</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-primary">إحصائيات الحضور</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["present","absent","late","excused"] as const).map((s) => (
            <div key={s} className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="text-xs text-muted-foreground">{ATT_LABEL[s]}</div>
              <div className="text-lg font-bold text-primary">{attSummary[s] ?? 0}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function PlanBox({ label, surah, from, to }: { label: string; surah: string | null; from: number | null; to: number | null }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{surah ?? "—"}</div>
      {from && to && <div className="text-xs text-muted-foreground">الآيات {from} إلى {to}</div>}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: "تمت", cls: "bg-secondary/20 text-secondary" },
    absent: { label: "غياب", cls: "bg-destructive/10 text-destructive" },
    postponed: { label: "مؤجلة", cls: "bg-accent/20 text-accent-foreground" },
    scheduled: { label: "مجدولة", cls: "bg-muted text-muted-foreground" },
    cancelled: { label: "ملغاة", cls: "bg-muted text-muted-foreground" },
  };
  const s = map[status] ?? map.scheduled;
  return <Badge className={`${s.cls} hover:${s.cls}`}>{s.label}</Badge>;
}
