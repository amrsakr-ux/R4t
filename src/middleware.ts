import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DASHBOARD_ROUTES } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";

export default auth((req: NextRequest & { auth: { user: { id: string; role: UserRole } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes
  const publicRoutes = ["/login", "/apply", "/register", "/api/auth", "/api/candidates/register", "/api/questions"];
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));
  if (isPublic) return NextResponse.next();

  // Protected routes
  if (!session) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role;

  // Role-based route protection
  if (pathname.startsWith("/ops") && !["ops_staff", "ops_admin", "system_admin"].includes(role)) {
    return NextResponse.redirect(new URL(DASHBOARD_ROUTES[role] || "/login", req.nextUrl.origin));
  }

  if (pathname.startsWith("/bd") && !["bd", "system_admin"].includes(role)) {
    return NextResponse.redirect(new URL(DASHBOARD_ROUTES[role] || "/login", req.nextUrl.origin));
  }

  if (pathname.startsWith("/admin") && role !== "system_admin") {
    return NextResponse.redirect(new URL(DASHBOARD_ROUTES[role] || "/login", req.nextUrl.origin));
  }

  if (pathname.startsWith("/status") && role !== "candidate") {
    return NextResponse.redirect(new URL(DASHBOARD_ROUTES[role] || "/ops", req.nextUrl.origin));
  }

  // Root redirect to appropriate dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL(DASHBOARD_ROUTES[role] || "/login", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
