import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "sana_session";

const PUBLIC_PATHS = ["/", "/login", "/forgot-password", "/about", "/programs", "/faq", "/contact"];
const PUBLIC_PREFIXES = ["/api/auth", "/_next", "/images", "/favicon"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

const DASHBOARD_BY_ROLE: Record<string, string> = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) return NextResponse.redirect(new URL("/login", req.nextUrl.origin));

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const role = payload.role as string;

    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE[role] ?? "/login", req.nextUrl.origin));
    }
    if (pathname.startsWith("/teacher") && role !== "teacher") {
      return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE[role] ?? "/login", req.nextUrl.origin));
    }
    if (pathname.startsWith("/student") && role !== "student") {
      return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE[role] ?? "/login", req.nextUrl.origin));
    }

    return NextResponse.next();
  } catch {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
