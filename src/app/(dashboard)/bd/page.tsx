import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/charts/stats-card";
import { BDDashboardCharts } from "@/components/charts/bd-charts";
import { Users, Briefcase, CheckCircle, TrendingUp } from "lucide-react";

async function getBDData() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/bd`, { cache: "no-store" });
    if (res.ok) return (await res.json()).data;
  } catch {}
  return null;
}

export default async function BDDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["bd", "system_admin"].includes(session.user.role)) redirect("/ops");

  const data = await getBDData();
  const stats = data || { qualifiedPool: 0, totalPlacements: 0, confirmedPlacements: 0, placementRate: 0, placementsByStatus: [], topClients: [], recentPlacements: [], trackAvailability: [] };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Business Development Dashboard"
        description="Candidate pool and placement management"
      />
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Qualified Pool" value={stats.qualifiedPool} icon={Users} iconColor="text-blue-600" iconBg="bg-blue-100" />
          <StatsCard title="Total Placements" value={stats.totalPlacements} icon={Briefcase} iconColor="text-purple-600" iconBg="bg-purple-100" />
          <StatsCard title="Confirmed Placements" value={stats.confirmedPlacements} icon={CheckCircle} iconColor="text-green-600" iconBg="bg-green-100" />
          <StatsCard title="Placement Rate" value={`${stats.placementRate}%`} icon={TrendingUp} iconColor="text-indigo-600" iconBg="bg-indigo-100" />
        </div>
        <BDDashboardCharts
          placementsByStatus={stats.placementsByStatus}
          topClients={stats.topClients}
          trackAvailability={stats.trackAvailability}
          recentPlacements={stats.recentPlacements}
        />
      </div>
    </div>
  );
}
