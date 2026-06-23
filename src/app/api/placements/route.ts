import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_staff", "ops_admin", "bd", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const status = searchParams.getAll("status");
  const clientId = searchParams.get("clientId");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { candidate: { user: { fullName: { contains: search, mode: "insensitive" } } } },
      { jobTitle: { contains: search, mode: "insensitive" } },
      { projectName: { contains: search, mode: "insensitive" } },
      { client: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (status.length > 0) where.placementStatus = { in: status };
  if (clientId) where.clientId = clientId;

  const [total, placements] = await Promise.all([
    prisma.placement.count({ where }),
    prisma.placement.findMany({
      where,
      include: {
        candidate: { include: { user: { select: { fullName: true, email: true } } } },
        client: true,
        jobOpportunity: { select: { title: true, jobTrack: true } },
        createdByUser: { select: { fullName: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ data: placements, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

const PlacementSchema = z.object({
  candidateId: z.string().uuid(),
  jobOpportunityId: z.string().uuid().optional(),
  clientId: z.string().uuid(),
  projectName: z.string().optional(),
  jobTitle: z.string().min(1),
  placementDate: z.string().transform((s) => new Date(s)),
  placementStatus: z.enum(["confirmed", "pending", "fell_through"]).default("pending"),
  salary: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_staff", "ops_admin", "bd", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const data = PlacementSchema.parse(body);

  const placement = await prisma.placement.create({
    data: { ...data, createdBy: session.user.id },
    include: {
      candidate: { include: { user: { select: { fullName: true } } } },
      client: true,
    },
  });

  // Update candidate status to placed
  await prisma.candidate.update({
    where: { id: data.candidateId },
    data: { status: "placed" },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "placement_created",
    entityType: "placement",
    entityId: placement.id,
    metadata: { candidateId: data.candidateId, clientId: data.clientId, jobTitle: data.jobTitle },
  });

  return NextResponse.json({ data: placement }, { status: 201 });
}
