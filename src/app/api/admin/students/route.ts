import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

const schema = z.object({
  fullName: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
  phone: z.string().optional(),
  programId: z.string().optional(),
  groupId: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: "هذا البريد مسجل بالفعل" }, { status: 409 });

  const passwordHash = await bcrypt.hash(d.password, 10);

  const user = await prisma.user.create({
    data: {
      email: d.email.toLowerCase().trim(),
      passwordHash,
      role: "student",
      fullName: d.fullName.trim(),
      phone: d.phone || null,
      student: {
        create: {
          programId: d.programId || null,
          groupId: d.groupId || null,
          guardianName: d.guardianName || null,
          guardianPhone: d.guardianPhone || null,
          notes: d.notes || null,
        },
      },
    },
    include: { student: true },
  });

  return NextResponse.json({ ok: true, id: user.student?.id });
}
