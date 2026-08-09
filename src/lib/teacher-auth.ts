import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { getSession } from "./auth";
import { currentAcademicYear } from "./academic-year";

export type TeacherContext = { userId: string; teacherId: string };

export async function requireTeacher(): Promise<
  { ok: true; ctx: TeacherContext } | { ok: false; response: NextResponse }
> {
  const session = await getSession();
  if (!session) return { ok: false, response: NextResponse.json({ error: "غير مصرح" }, { status: 401 }) };
  if (session.role !== "teacher") return { ok: false, response: NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 }) };
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.id }, select: { id: true } });
  if (!teacher) return { ok: false, response: NextResponse.json({ error: "لا يوجد سجل معلمة" }, { status: 403 }) };
  return { ok: true, ctx: { userId: session.id, teacherId: teacher.id } };
}

export async function getTeacherIdForSession(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "teacher") return null;
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.id }, select: { id: true } });
  return teacher?.id ?? null;
}

// Ensures a student is currently enrolled in a group owned by this teacher (this academic year).
export async function assertTeacherOwnsStudent(teacherId: string, studentId: string): Promise<boolean> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      academicYear: currentAcademicYear(),
      status: "active",
      group: { teacherId },
    },
    select: { id: true },
  });
  return !!enrollment;
}

export async function assertTeacherOwnsGroup(teacherId: string, groupId: string): Promise<boolean> {
  const group = await prisma.group.findFirst({ where: { id: groupId, teacherId }, select: { id: true } });
  return !!group;
}

export async function assertTeacherOwnsLesson(teacherId: string, lessonId: string): Promise<boolean> {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, group: { teacherId } },
    select: { id: true },
  });
  return !!lesson;
}
