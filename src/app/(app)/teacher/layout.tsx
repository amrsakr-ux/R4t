import Link from "next/link";
import { LayoutDashboard, Users, BookOpen } from "lucide-react";

const NAV = [
  { href: "/teacher", label: "لوحة اليوم", icon: LayoutDashboard },
  { href: "/teacher/students", label: "طالباتي", icon: Users },
  { href: "/teacher/groups", label: "حلقاتي", icon: BookOpen },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 md:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href}
            className="flex flex-1 min-w-[100px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-primary">
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block md:sticky md:top-20 md:h-fit">
          <nav className="rounded-2xl border border-border bg-card p-2">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-primary">
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
