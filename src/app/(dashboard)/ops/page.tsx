import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/charts/stats-card";
import { OpsDashboardCharts } from "@/components/charts/ops-charts";
import { Users, UserCheck, Briefcase, TrendingUp, Star, Clock } from "lucide-react";

async function getDashboardData() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/ops`, {
      cache: "no-store",
      headers: { Cookie: "" },
    });
    if (res.ok) return (await res.json()).data;
  } catch {}
  return null;
}

export default async function OpsDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const data = await getDashboardData();

  const stats = data || {
    totalCandidates: 0,
    qualifiedCandidates: 0,
    shortlistedCandidates: 0,
    placedCandidates: 0,
    averageScore: 0,
    newCandidatesThisWeek: 0,
    totalPlacements: 0,
    statusDistribution: [],
    trackDistribution: [],
    recentActivity: [],
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Operations Dashboard"
        description={`Welcome back, ${session.user.name}. Here's your pipeline overview.`}
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatsCard
            title="Total Candidates"
            value={stats.totalCandidates}
            icon={Users}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
            change={`+${stats.newCandidatesThisWeek} this week`}
            changeType="positive"
          />
          <StatsCard
            title="Qualified"
            value={stats.qualifiedCandidates}
            icon={UserCheck}
            iconColor="text-green-600"
            iconBg="bg-green-100"
          />
          <StatsCard
            title="Shortlisted"
            value={stats.shortlistedCandidates}
            icon={Star}
            iconColor="text-yellow-600"
            iconBg="bg-yellow-100"
          />
          <StatsCard
            title="Placed"
            value={stats.placedCandidates}
            icon={Briefcase}
            iconColor="text-purple-600"
            iconBg="bg-purple-100"
          />
          <StatsCard
            title="Avg Score"
            value={`${stats.averageScore}/100`}
            icon={TrendingUp}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-100"
          />
          <StatsCard
            title="Total Placements"
            value={stats.totalPlacements}
            icon={Clock}
            iconColor="text-pink-600"
            iconBg="bg-pink-100"
          />
        </div>

        {/* Charts */}
        <OpsDashboardCharts
          statusDistribution={stats.statusDistribution}
          trackDistribution={stats.trackDistribution}
          recentActivity={stats.recentActivity}
        />
      </div>
    </div>
  );
}
