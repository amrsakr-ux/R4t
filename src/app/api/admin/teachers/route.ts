import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
});

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: "هذا البريد مسجل بالفعل" }, { status: 409 });

  const passwordHash = await bcrypt.hash(d.password, 10);
  await prisma.user.create({
    data: {
      email: d.email.toLowerCase().trim(),
      passwordHash,
      role: "teacher",
      fullName: d.fullName.trim(),
      phone: d.phone || null,
      teacher: {
        create: {
          specialty: d.specialty || null,
          bio: d.bio || null,
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
