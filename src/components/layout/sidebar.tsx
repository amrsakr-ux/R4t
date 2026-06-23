"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Building2,
  ClipboardList,
  BarChart3,
  Shield,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserRole } from "@prisma/client";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const OPS_NAV: NavItem[] = [
  { label: "Dashboard", href: "/ops", icon: LayoutDashboard },
  { label: "Candidates", href: "/ops/candidates", icon: Users },
  { label: "Job Tracks", href: "/ops/tracks", icon: Briefcase },
  { label: "Assessment Q&A", href: "/ops/questions", icon: ClipboardList },
  { label: "Reports", href: "/ops/reports", icon: BarChart3 },
];

const BD_NAV: NavItem[] = [
  { label: "Dashboard", href: "/bd", icon: LayoutDashboard },
  { label: "Candidate Pool", href: "/bd/candidates", icon: Users },
  { label: "Placements", href: "/bd/placements", icon: Briefcase },
  { label: "Clients", href: "/bd/clients", icon: Building2 },
  { label: "Reports", href: "/bd/reports", icon: BarChart3 },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Clients", href: "/admin/clients", icon: Building2 },
  { label: "Job Opportunities", href: "/admin/jobs", icon: Briefcase },
  { label: "Questions", href: "/admin/questions", icon: ClipboardList },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  ops_staff: OPS_NAV,
  ops_admin: OPS_NAV,
  bd: BD_NAV,
  system_admin: ADMIN_NAV,
};

interface SidebarProps {
  userRole: UserRole;
  userName: string;
  userEmail: string;
}

export function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const navItems = NAV_BY_ROLE[userRole] || OPS_NAV;

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel: Record<string, string> = {
    ops_staff: "Operations Staff",
    ops_admin: "Operations Admin",
    bd: "Business Development",
    system_admin: "System Admin",
  };

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white w-64">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">R4T Platform</h1>
          <p className="text-xs text-slate-400">Operations</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/ops" && item.href !== "/bd" && item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-blue-600 text-white text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-slate-400 truncate">{roleLabel[userRole] || userRole}</p>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white h-8 w-8">
            <Bell className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 text-sm h-9"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
