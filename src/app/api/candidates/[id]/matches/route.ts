import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_staff", "ops_admin", "bd", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const matches = await prisma.candidateJobMatch.findMany({
    where: { candidateId: id },
    include: {
      jobOpportunity: {
        include: { client: { select: { id: true, name: true, industry: true } } },
      },
    },
    orderBy: { recommendedRank: "asc" },
  });

  return NextResponse.json({ data: matches });
}
