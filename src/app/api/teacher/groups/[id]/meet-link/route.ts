import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher, assertTeacherOwnsGroup } from "@/lib/teacher-auth";

const schema = z.object({
  meetLink: z.string().url("رابط غير صحيح").or(z.literal("").transform(() => "")),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const owns = await assertTeacherOwnsGroup(auth.ctx.teacherId, id);
  if (!owns) return NextResponse.json({ error: "ليس لديكِ صلاحية على هذه الحلقة" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });

  await prisma.group.update({
    where: { id },
    data: { meetLink: parsed.data.meetLink || null },
  });

  return NextResponse.json({ ok: true });
}
