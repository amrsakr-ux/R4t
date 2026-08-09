import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { ensureUniqueUsername } from "@/lib/username";
import { academicYearRange } from "@/lib/academic-year";

const schema = z.object({
  fullName: z.string().min(2, "الاسم مطلوب"),
  username: z.string().min(3, "اسم المستخدم مطلوب").regex(/^[a-z0-9_]+$/i, "أحرف إنجليزية وأرقام فقط"),
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  notes: z.string().optional(),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, "العام الدراسي غير صحيح"),
  programId: z.string().optional().or(z.literal("").transform(() => undefined)),
  groupId: z.string().optional().or(z.literal("").transform(() => undefined)),
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

  const username = await ensureUniqueUsername(d.username);
  if (d.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: d.email.toLowerCase().trim() } });
    if (existingEmail) return NextResponse.json({ error: "هذا البريد مسجل بالفعل" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(d.password, 10);
  const { startDate } = academicYearRange(d.academicYear);

  const user = await prisma.user.create({
    data: {
      username,
      email: d.email ? d.email.toLowerCase().trim() : null,
      passwordHash,
      role: "student",
      fullName: d.fullName.trim(),
      phone: d.phone || null,
      mustChangePassword: true,
      student: {
        create: {
          guardianName: d.guardianName || null,
          guardianPhone: d.guardianPhone || null,
          notes: d.notes || null,
          enrollments: {
            create: {
              academicYear: d.academicYear,
              programId: d.programId || null,
              groupId: d.groupId || null,
              startDate,
              status: "active",
            },
          },
        },
      },
    },
    include: { student: true },
  });

  return NextResponse.json({ ok: true, id: user.student?.id, username });
}
