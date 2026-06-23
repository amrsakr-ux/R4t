import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const questions = await prisma.assessmentQuestion.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
    select: {
      id: true,
      questionText: true,
      category: true,
      displayOrder: true,
    },
  });
  return NextResponse.json({ data: questions });
}
