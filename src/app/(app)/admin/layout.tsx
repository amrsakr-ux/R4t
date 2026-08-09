import Link from "next/link";
import { LayoutDashboard, Users, GraduationCap, BookOpen, CreditCard, Calendar, ScrollText } from "lucide-react";

const NAV = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/students", label: "الطالبات", icon: Users },
  { href: "/admin/enrollments", label: "التسجيلات السنوية", icon: ScrollText },
  { href: "/admin/teachers", label: "المعلمات", icon: GraduationCap },
  { href: "/admin/groups", label: "الحلقات", icon: BookOpen },
  { href: "/admin/schedules", label: "الجداول", icon: Calendar },
  { href: "/admin/payments", label: "المدفوعات", icon: CreditCard },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-20 md:h-fit">
        <nav className="rounded-2xl border border-border bg-card p-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-primary"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
