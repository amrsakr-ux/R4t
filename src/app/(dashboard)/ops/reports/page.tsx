import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Briefcase } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function OpsReportsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Reports"
        description="Analytics and reporting for operations"
        actions={
          <a href="/api/candidates/export" download>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" /> Export All Candidates
            </Button>
          </a>
        }
      />
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Pipeline Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm mb-4">View the full pipeline breakdown on your dashboard.</p>
              <Link href="/ops">
                <Button variant="outline">View Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Candidate Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm mb-4">Export the full candidate list for offline analysis.</p>
              <a href="/api/candidates/export" download>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </Button>
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                Placements Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm mb-4">Export placement data including client and role details.</p>
              <a href="/api/placements/export?format=xlsx" download>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-1" /> Export Excel
                </Button>
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                AI Score Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm mb-4">Analyze score distributions across all candidates.</p>
              <Link href="/ops/candidates">
                <Button variant="outline">View Candidates</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
