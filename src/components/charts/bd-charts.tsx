"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

interface BDChartsProps {
  placementsByStatus: { status: string; count: number }[];
  topClients: { clientName: string; count: number }[];
  trackAvailability: { track: string; count: number }[];
  recentPlacements: { id: string; candidateName: string; clientName: string; jobTitle: string; status: string; date: string }[];
}

export function BDDashboardCharts({ placementsByStatus, topClients, trackAvailability, recentPlacements }: BDChartsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Placements by Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={placementsByStatus.map(p => ({ name: p.status, value: p.count }))} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {placementsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Clients</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topClients}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="clientName" fontSize={11} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Available by Track</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trackAvailability.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="track" fontSize={11} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Placements */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Placements</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentPlacements.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No placements recorded yet</p>
            ) : (
              recentPlacements.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{p.candidateName}</p>
                    <p className="text-xs text-gray-500">{p.jobTitle} at {p.clientName}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={p.status === "confirmed" ? "default" : "outline"} className="text-xs">
                      {p.status}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(p.date)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
