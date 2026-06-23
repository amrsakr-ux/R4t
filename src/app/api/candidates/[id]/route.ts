import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Candidates can only view their own profile
  if (session.user.role === "candidate") {
    const candidate = await prisma.candidate.findUnique({ where: { userId: session.user.id } });
    if (!candidate || candidate.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, fullName: true, role: true, createdAt: true } },
      aiScores: { orderBy: { computedAt: "desc" }, take: 1 },
      cvDocuments: { orderBy: { uploadedAt: "desc" } },
      assessmentResponses: {
        include: { question: { select: { id: true, questionText: true, category: true } } },
        orderBy: { createdAt: "asc" },
      },
      jobMatches: {
        include: { jobOpportunity: { select: { id: true, title: true, jobTrack: true, requiredSkills: true } } },
        orderBy: { recommendedRank: "asc" },
        take: 10,
      },
      placements: {
        include: { client: true, jobOpportunity: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  return NextResponse.json({ data: candidate });
}

const UpdateCandidateSchema = z.object({
  phone: z.string().optional(),
  educationLevel: z.string().optional(),
  graduationStatus: z.enum(["graduated", "in_progress", "not_started"]).optional(),
  careerInterests: z.array(z.string()).optional(),
  preferredJobTracks: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const body = await request.json();

  // Candidate can only update their own profile (no notes)
  if (session.user.role === "candidate") {
    const candidate = await prisma.candidate.findUnique({ where: { userId: session.user.id } });
    if (!candidate || candidate.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    delete body.notes;
  } else if (!["ops_staff", "ops_admin", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = UpdateCandidateSchema.parse(body);

  const updated = await prisma.candidate.update({
    where: { id },
    data,
    include: { user: { select: { fullName: true, email: true } } },
  });

  return NextResponse.json({ data: updated });
}
