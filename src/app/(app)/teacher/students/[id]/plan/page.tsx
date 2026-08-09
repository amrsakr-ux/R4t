import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTeacherIdForSession, assertTeacherOwnsStudent } from "@/lib/teacher-auth";
import { PlanForm } from "./plan-form";

export const dynamic = "force-dynamic";

export default async function StudentPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const teacherId = await getTeacherIdForSession();
  if (!teacherId) redirect("/login");
  const { id } = await params;

  const authorized = await assertTeacherOwnsStudent(teacherId, id);
  if (!authorized) notFound();

  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: { select: { fullName: true } }, memorizationPlan: true },
  });
  if (!student) notFound();

  return (
    <div>
      <Link href={`/teacher/students/${id}`} className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
        <ArrowRight className="h-3 w-3" />
        العودة لملف الطالبة
      </Link>
      <h1 className="mb-1 text-xl font-bold text-primary">خطة الحفظ — {student.user.fullName}</h1>
      <p className="mb-5 text-sm text-muted-foreground">حددي الجديد الحالي والمراجعة ونسبة التقدم.</p>

      <div className="max-w-2xl rounded-2xl border border-border bg-card p-5">
        <PlanForm
          studentId={id}
          initial={student.memorizationPlan ? {
            currentSurah: student.memorizationPlan.currentSurah ?? "",
            currentAyahFrom: student.memorizationPlan.currentAyahFrom ?? "",
            currentAyahTo: student.memorizationPlan.currentAyahTo ?? "",
            reviewSurah: student.memorizationPlan.reviewSurah ?? "",
            reviewAyahFrom: student.memorizationPlan.reviewAyahFrom ?? "",
            reviewAyahTo: student.memorizationPlan.reviewAyahTo ?? "",
            progressPct: student.memorizationPlan.progressPct,
            notes: student.memorizationPlan.notes ?? "",
          } : null}
        />
      </div>
    </div>
  );
}
