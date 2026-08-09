import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher, assertTeacherOwnsStudent } from "@/lib/teacher-auth";

const schema = z.object({
  currentSurah: z.string().nullable().optional(),
  currentAyahFrom: z.number().int().positive().nullable().optional(),
  currentAyahTo: z.number().int().positive().nullable().optional(),
  reviewSurah: z.string().nullable().optional(),
  reviewAyahFrom: z.number().int().positive().nullable().optional(),
  reviewAyahTo: z.number().int().positive().nullable().optional(),
  progressPct: z.number().int().min(0).max(100),
  notes: z.string().nullable().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;
  const { studentId } = await params;

  const authorized = await assertTeacherOwnsStudent(auth.ctx.teacherId, studentId);
  if (!authorized) return NextResponse.json({ error: "ليس لديكِ صلاحية" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  const d = parsed.data;

  await prisma.memorizationPlan.upsert({
    where: { studentId },
    create: { studentId, ...d, notes: d.notes ?? null },
    update: { ...d, notes: d.notes ?? null },
  });

  return NextResponse.json({ ok: true });
}
