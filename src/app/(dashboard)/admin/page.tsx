import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, Briefcase, Building2, ClipboardList, FileText, Settings, Shield } from "lucide-react";

const adminSections = [
  { title: "User Management", description: "Manage staff accounts and roles", href: "/admin/users", icon: Users, color: "text-blue-600 bg-blue-100" },
  { title: "Client Management", description: "Manage client companies", href: "/admin/clients", icon: Building2, color: "text-green-600 bg-green-100" },
  { title: "Job Opportunities", description: "Manage job listings and tracks", href: "/admin/jobs", icon: Briefcase, color: "text-purple-600 bg-purple-100" },
  { title: "Assessment Questions", description: "Configure assessment flow", href: "/admin/questions", icon: ClipboardList, color: "text-yellow-600 bg-yellow-100" },
  { title: "Audit Logs", description: "View all system activity", href: "/admin/audit-logs", icon: FileText, color: "text-red-600 bg-red-100" },
  { title: "System Settings", description: "Configure AI weights and settings", href: "/admin/settings", icon: Settings, color: "text-indigo-600 bg-indigo-100" },
];

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== "system_admin") redirect("/ops");

  return (
    <div className="flex flex-col h-full">
      <Header title="Admin Panel" description="System administration and configuration" />
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminSections.map((s) => (
            <Link key={s.href} href={s.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{s.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
