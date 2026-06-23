import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logExport } from "@/lib/audit";

async function buildExport(request: NextRequest, candidateIds?: string[]) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_staff", "ops_admin", "bd", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.getAll("status");

  const candidates = await prisma.candidate.findMany({
    where: {
      ...(candidateIds?.length ? { id: { in: candidateIds } } : {}),
      ...(statusFilter.length ? { status: { in: statusFilter as never[] } } : {}),
    },
    include: {
      user: { select: { fullName: true, email: true } },
      aiScores: { orderBy: { computedAt: "desc" }, take: 1 },
    },
  });

  await logExport(session.user.id, "candidates", candidates.length);

  const headers = ["Name", "Email", "Status", "Track", "Score", "Education", "Graduation Status"];
  const rows = candidates.map((c) => [
    c.user.fullName,
    c.user.email,
    c.status,
    c.preferredJobTracks.join("; "),
    c.aiScores[0]?.overallScore?.toString() || "",
    c.educationLevel || "",
    c.graduationStatus || "",
  ]);

  const csv = [headers, ...rows].map((r) => r.map((cell) => `"${cell}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="candidates-${Date.now()}.csv"`,
    },
  });
}

export async function GET(request: NextRequest) {
  return buildExport(request);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return buildExport(request, body.candidateIds);
}
