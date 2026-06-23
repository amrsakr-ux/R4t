import { NextRequest, NextResponse } from "next/server";
import { matchCandidateToJobs } from "@/services/ai/matching";

function verifyInternalSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-internal-secret");
  return secret === (process.env.INTERNAL_API_SECRET || "");
}

export async function POST(request: NextRequest) {
  if (!verifyInternalSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { candidateId } = await request.json();
  if (!candidateId) return NextResponse.json({ error: "candidateId required" }, { status: 400 });

  try {
    await matchCandidateToJobs(candidateId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Matching error:", error);
    return NextResponse.json({ error: "Matching failed", details: String(error) }, { status: 500 });
  }
}
