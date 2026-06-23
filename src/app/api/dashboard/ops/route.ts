import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_staff", "ops_admin", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalCandidates,
    statusDistribution,
    averageScoreResult,
    recentCandidates,
    trackDistribution,
    totalPlacements,
    recentActivity,
  ] = await Promise.all([
    prisma.candidate.count(),
    prisma.candidate.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.aiScore.aggregate({ _avg: { overallScore: true } }),
    prisma.candidate.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.candidate.findMany({
      select: { preferredJobTracks: true },
    }),
    prisma.placement.count(),
    // Daily activity for last 30 days
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(created_at)::text as date, COUNT(*)::bigint as count
      FROM candidates
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
  ]);

  const qualifiedCount = statusDistribution
    .filter((s) => ["scored", "shortlisted", "placed"].includes(s.status))
    .reduce((sum, s) => sum + s._count.status, 0);

  const shortlistedCount =
    statusDistribution.find((s) => s.status === "shortlisted")?._count.status || 0;
  const placedCount = statusDistribution.find((s) => s.status === "placed")?._count.status || 0;

  // Aggregate track distribution
  const trackCounts: Record<string, number> = {};
  trackDistribution.forEach((c) => {
    c.preferredJobTracks.forEach((track) => {
      trackCounts[track] = (trackCounts[track] || 0) + 1;
    });
  });

  return NextResponse.json({
    data: {
      totalCandidates,
      qualifiedCandidates: qualifiedCount,
      shortlistedCandidates: shortlistedCount,
      placedCandidates: placedCount,
      averageScore: Math.round(averageScoreResult._avg.overallScore || 0),
      newCandidatesThisWeek: recentCandidates,
      totalPlacements,
      statusDistribution: statusDistribution.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      trackDistribution: Object.entries(trackCounts)
        .map(([track, count]) => ({ track, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      recentActivity: recentActivity.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
    },
  });
}
