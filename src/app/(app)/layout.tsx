import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, LogOut } from "lucide-react";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const roleLabel = { student: "طالبة", teacher: "معلمة", admin: "إدارة" }[session.role];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link href={`/${session.role}`} className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <div className="font-bold text-primary">سَنَا</div>
              <div className="text-[10px] text-muted-foreground">{roleLabel}</div>
            </div>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">مرحبًا،</span>
            <span className="font-medium">{session.fullName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">{children}</div>
      </main>
    </div>
  );
}
