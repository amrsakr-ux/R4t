import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher, assertTeacherOwnsStudent, assertTeacherOwnsGroup } from "@/lib/teacher-auth";

const schema = z.object({
  studentId: z.string().uuid(),
  groupId: z.string().uuid(),
  attendance: z.enum(["present", "absent", "postponed"]),
  hasNewMemorization: z.boolean().default(false),
  newPortion: z.string().optional().default(""),
  reviewPortion: z.string().optional().default(""),
  errorsCount: z.number().int().nonnegative().nullable().optional(),
  errorsType: z.string().optional().default(""),
  evaluation: z.enum(["excellent", "very_good", "good", "needs_review"]).nullable().optional(),
  homework: z.string().optional().default(""),
  teacherNotes: z.string().optional().default(""),
});

export async function POST(req: Request) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;
  const { teacherId } = auth.ctx;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  }
  const d = parsed.data;

  const [ownsStudent, ownsGroup] = await Promise.all([
    assertTeacherOwnsStudent(teacherId, d.studentId),
    assertTeacherOwnsGroup(teacherId, d.groupId),
  ]);
  if (!ownsStudent || !ownsGroup) {
    return NextResponse.json({ error: "ليس لديكِ صلاحية على هذه الطالبة" }, { status: 403 });
  }

  const lessonStatus =
    d.attendance === "postponed" ? "postponed" :
    d.attendance === "absent" ? "absent" : "completed";

  const result = await prisma.$transaction(async (tx) => {
    const lesson = await tx.lesson.create({
      data: {
        groupId: d.groupId,
        studentId: d.studentId,
        scheduledAt: new Date(),
        status: lessonStatus,
        newPortion: d.newPortion || null,
        reviewPortion: d.reviewPortion || null,
        errorsCount: d.errorsCount ?? null,
        errorsType: d.errorsType || null,
        hasNewMemorization: d.hasNewMemorization,
        homework: d.homework || null,
        teacherNotes: d.teacherNotes || null,
      },
    });

    await tx.attendance.create({
      data: {
        lessonId: lesson.id,
        studentId: d.studentId,
        status: d.attendance === "postponed" ? "excused" : d.attendance,
      },
    });

    if (d.attendance === "present" && d.evaluation) {
      await tx.evaluation.create({
        data: {
          lessonId: lesson.id,
          studentId: d.studentId,
          memorization: d.evaluation,
          review: d.evaluation,
          tajweed: d.evaluation,
          commitment: d.evaluation,
          overallNote: d.teacherNotes || null,
        },
      });
    }

    return lesson;
  });

  return NextResponse.json({ ok: true, id: result.id });
}
