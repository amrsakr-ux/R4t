import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DASHBOARD_ROUTES } from "@/lib/rbac";

export default async function RootPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const role = session.user.role as keyof typeof DASHBOARD_ROUTES;
  redirect(DASHBOARD_ROUTES[role] ?? "/login");
}
