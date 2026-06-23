import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_admin", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const questions = await prisma.assessmentQuestion.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ data: questions });
}

const QuestionSchema = z.object({
  questionText: z.string().min(10),
  category: z.enum(["motivation", "goals", "challenges", "experience", "skills", "preferences"]),
  displayOrder: z.number().int().min(1),
  isActive: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_admin", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const data = QuestionSchema.parse(body);

  const question = await prisma.assessmentQuestion.create({ data });
  return NextResponse.json({ data: question }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_admin", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: "Question ID required" }, { status: 400 });

  const question = await prisma.assessmentQuestion.update({
    where: { id },
    data,
  });

  return NextResponse.json({ data: question });
}
