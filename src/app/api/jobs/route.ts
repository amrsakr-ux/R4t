import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_staff", "ops_admin", "bd", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const track = searchParams.get("track");
  const isActive = searchParams.get("isActive");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { jobTrack: { contains: search, mode: "insensitive" } },
    ];
  }
  if (track) where.jobTrack = track;
  if (isActive !== null) where.isActive = isActive === "true";

  const [total, jobs] = await Promise.all([
    prisma.jobOpportunity.count({ where }),
    prisma.jobOpportunity.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, industry: true } },
        _count: { select: { jobMatches: true, placements: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ data: jobs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

const JobSchema = z.object({
  title: z.string().min(2),
  clientId: z.string().uuid().optional(),
  requiredSkills: z.array(z.string()),
  requiredExperienceYears: z.number().int().min(0).optional(),
  jobTrack: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_admin", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const data = JobSchema.parse(body);

  const job = await prisma.jobOpportunity.create({ data });

  return NextResponse.json({ data: job }, { status: 201 });
}
