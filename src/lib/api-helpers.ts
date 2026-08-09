import { NextResponse } from "next/server";
import { getSession } from "./auth";
import type { UserRole } from "@prisma/client";

export async function requireRole(role: UserRole) {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "غير مصرح" }, { status: 401 }), session: null };
  if (session.role !== role) return { error: NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 }), session: null };
  return { error: null, session };
}

export async function requireAdmin() {
  return requireRole("admin");
}
