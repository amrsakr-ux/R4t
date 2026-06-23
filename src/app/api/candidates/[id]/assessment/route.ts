import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AssessmentSchema = z.object({
  responses: z.array(
    z.object({
      questionId: z.string().uuid(),
      responseText: z.string().min(10, "Response must be at least 10 characters"),
    })
  ).min(1),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Candidates can only submit their own assessment
  if (session.user.role === "candidate") {
    const candidate = await prisma.candidate.findUnique({ where: { userId: session.user.id } });
    if (!candidate || candidate.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  const body = await request.json();
  const { responses } = AssessmentSchema.parse(body);

  // Verify all question IDs are valid
  const questionIds = responses.map((r) => r.questionId);
  const questions = await prisma.assessmentQuestion.findMany({
    where: { id: { in: questionIds }, isActive: true },
  });

  if (questions.length !== questionIds.length) {
    return NextResponse.json({ error: "Invalid question IDs" }, { status: 400 });
  }

  // Upsert responses
  await Promise.all(
    responses.map((r) =>
      prisma.assessmentResponse.upsert({
        where: { candidateId_questionId: { candidateId: id, questionId: r.questionId } },
        update: { responseText: r.responseText },
        create: { candidateId: id, questionId: r.questionId, responseText: r.responseText },
      })
    )
  );

  // Update status to assessed
  await prisma.candidate.update({
    where: { id },
    data: { status: "assessed" },
  });

  return NextResponse.json({ success: true, message: "Assessment submitted successfully" });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const responses = await prisma.assessmentResponse.findMany({
    where: { candidateId: id },
    include: {
      question: { select: { id: true, questionText: true, category: true, displayOrder: true } },
    },
    orderBy: { question: { displayOrder: "asc" } },
  });

  return NextResponse.json({ data: responses });
}
