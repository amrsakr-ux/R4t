import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CandidateFilters } from "@/types";
import type { CandidateStatus, GraduationStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (!["ops_staff", "ops_admin", "bd", "system_admin"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const filters: CandidateFilters = {
    search: searchParams.get("search") || undefined,
    status: searchParams.getAll("status") as CandidateStatus[],
    track: searchParams.getAll("track"),
    minScore: searchParams.get("minScore") ? parseInt(searchParams.get("minScore")!) : undefined,
    maxScore: searchParams.get("maxScore") ? parseInt(searchParams.get("maxScore")!) : undefined,
    graduationStatus: searchParams.getAll("graduationStatus") as GraduationStatus[],
    page: parseInt(searchParams.get("page") || "1"),
    pageSize: parseInt(searchParams.get("pageSize") || "20"),
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  };

  const where: Record<string, unknown> = {};

  if (filters.search) {
    where.OR = [
      { user: { fullName: { contains: filters.search, mode: "insensitive" } } },
      { user: { email: { contains: filters.search, mode: "insensitive" } } },
      { phone: { contains: filters.search } },
    ];
  }

  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  if (filters.track && filters.track.length > 0) {
    where.preferredJobTracks = { hasSome: filters.track };
  }

  if (filters.graduationStatus && filters.graduationStatus.length > 0) {
    where.graduationStatus = { in: filters.graduationStatus };
  }

  // Score filter — need to join via aiScores
  const scoreFilter =
    filters.minScore !== undefined || filters.maxScore !== undefined
      ? {
          aiScores: {
            some: {
              overallScore: {
                ...(filters.minScore !== undefined ? { gte: filters.minScore } : {}),
                ...(filters.maxScore !== undefined ? { lte: filters.maxScore } : {}),
              },
            },
          },
        }
      : {};

  const [total, candidates] = await Promise.all([
    prisma.candidate.count({ where: { ...where, ...scoreFilter } }),
    prisma.candidate.findMany({
      where: { ...where, ...scoreFilter },
      include: {
        user: { select: { id: true, email: true, fullName: true, role: true } },
        aiScores: { orderBy: { computedAt: "desc" }, take: 1 },
        cvDocuments: { orderBy: { uploadedAt: "desc" }, take: 1, select: { parseStatus: true, uploadedAt: true } },
      },
      skip: ((filters.page || 1) - 1) * (filters.pageSize || 20),
      take: filters.pageSize || 20,
      orderBy:
        filters.sortBy === "score"
          ? { aiScores: { _count: "desc" } }
          : { [filters.sortBy || "createdAt"]: filters.sortOrder || "desc" },
    }),
  ]);

  return NextResponse.json({
    data: candidates,
    total,
    page: filters.page || 1,
    pageSize: filters.pageSize || 20,
    totalPages: Math.ceil(total / (filters.pageSize || 20)),
  });
}
