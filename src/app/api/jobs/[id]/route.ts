import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = await prisma.jobOpportunity.findUnique({
    where: { id },
    include: {
      client: true,
      _count: { select: { jobMatches: true, placements: true } },
    },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({ data: job });
}

const UpdateJobSchema = z.object({
  title: z.string().min(2).optional(),
  clientId: z.string().uuid().optional().nullable(),
  requiredSkills: z.array(z.string()).optional(),
  requiredExperienceYears: z.number().int().min(0).optional().nullable(),
  jobTrack: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_admin", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const data = UpdateJobSchema.parse(body);

  const job = await prisma.jobOpportunity.update({ where: { id }, data });
  return NextResponse.json({ data: job });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_admin", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.jobOpportunity.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
