import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["bd", "ops_admin", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    qualifiedPool,
    totalPlacements,
    placementStatus,
    topClients,
    recentPlacements,
    trackAvailability,
  ] = await Promise.all([
    prisma.candidate.count({ where: { status: { in: ["scored", "shortlisted"] } } }),
    prisma.placement.count(),
    prisma.placement.groupBy({ by: ["placementStatus"], _count: { placementStatus: true } }),
    prisma.placement.groupBy({
      by: ["clientId"],
      _count: { clientId: true },
      orderBy: { _count: { clientId: "desc" } },
      take: 5,
    }),
    prisma.placement.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        candidate: { include: { user: { select: { fullName: true } } } },
        client: { select: { name: true } },
      },
    }),
    prisma.candidate.findMany({
      where: { status: { in: ["scored", "shortlisted"] } },
      select: { preferredJobTracks: true },
    }),
  ]);

  const confirmedPlacements =
    placementStatus.find((p) => p.placementStatus === "confirmed")?._count.placementStatus || 0;

  const trackCounts: Record<string, number> = {};
  trackAvailability.forEach((c) => {
    c.preferredJobTracks.forEach((t) => {
      trackCounts[t] = (trackCounts[t] || 0) + 1;
    });
  });

  // Get client names
  const clientIds = topClients.map((c) => c.clientId);
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true },
  });
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  return NextResponse.json({
    data: {
      qualifiedPool,
      totalPlacements,
      confirmedPlacements,
      placementRate: totalPlacements > 0 ? Math.round((confirmedPlacements / totalPlacements) * 100) : 0,
      placementsByStatus: placementStatus.map((p) => ({
        status: p.placementStatus,
        count: p._count.placementStatus,
      })),
      topClients: topClients.map((c) => ({
        clientId: c.clientId,
        clientName: clientMap[c.clientId] || "Unknown",
        count: c._count.clientId,
      })),
      recentPlacements: recentPlacements.map((p) => ({
        id: p.id,
        candidateName: p.candidate.user.fullName,
        clientName: p.client.name,
        jobTitle: p.jobTitle,
        status: p.placementStatus,
        date: p.placementDate,
      })),
      trackAvailability: Object.entries(trackCounts)
        .map(([track, count]) => ({ track, count }))
        .sort((a, b) => b.count - a.count),
    },
  });
}
