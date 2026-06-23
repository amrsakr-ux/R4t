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

  const scores = await prisma.aiScore.findMany({
    where: { candidateId: id },
    orderBy: { computedAt: "desc" },
  });

  if (scores.length === 0) {
    return NextResponse.json({ error: "No scores found" }, { status: 404 });
  }

  return NextResponse.json({ data: scores[0], history: scores });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_admin", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Trigger re-scoring
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    fetch(`${appUrl}/api/internal/ai/score-candidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
      },
      body: JSON.stringify({ candidateId: id }),
    }).catch(console.error);

    return NextResponse.json({ success: true, message: "Re-scoring triggered" });
  } catch (err) {
    console.error("Re-scoring error:", err);
    return NextResponse.json({ error: "Failed to trigger re-scoring" }, { status: 500 });
  }
}
