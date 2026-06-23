import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Briefcase, Users, TrendingUp } from "lucide-react";

export default function BDReportsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="BD Reports" description="Business development analytics and exports" />
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                Placements Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm mb-4">Export all placement records.</p>
              <div className="flex gap-2">
                <a href="/api/placements/export?format=csv" download>
                  <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> CSV</Button>
                </a>
                <a href="/api/placements/export?format=xlsx" download>
                  <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Excel</Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Qualified Candidates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm mb-4">Export qualified candidate pool.</p>
              <a href="/api/candidates/export?status=scored&status=shortlisted" download>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Confirmed Placements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm mb-4">Export only confirmed placement records.</p>
              <a href="/api/placements/export?format=xlsx&status=confirmed" download>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Excel</Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
