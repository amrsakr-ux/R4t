import type { UserRole } from "@prisma/client";

type Permission =
  | "candidates:read"
  | "candidates:write"
  | "candidates:status"
  | "candidates:score"
  | "assessment:manage"
  | "jobs:read"
  | "jobs:write"
  | "placements:read"
  | "placements:write"
  | "placements:export"
  | "bd:dashboard"
  | "ops:dashboard"
  | "admin:users"
  | "admin:system"
  | "audit:read"
  | "clients:manage";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  candidate: [],
  ops_staff: [
    "candidates:read",
    "candidates:status",
    "candidates:score",
    "jobs:read",
    "ops:dashboard",
  ],
  ops_admin: [
    "candidates:read",
    "candidates:write",
    "candidates:status",
    "candidates:score",
    "assessment:manage",
    "jobs:read",
    "jobs:write",
    "ops:dashboard",
    "audit:read",
    "placements:read",
    "clients:manage",
  ],
  bd: [
    "candidates:read",
    "candidates:score",
    "jobs:read",
    "placements:read",
    "placements:write",
    "placements:export",
    "bd:dashboard",
    "clients:manage",
  ],
  system_admin: [
    "candidates:read",
    "candidates:write",
    "candidates:status",
    "candidates:score",
    "assessment:manage",
    "jobs:read",
    "jobs:write",
    "placements:read",
    "placements:write",
    "placements:export",
    "bd:dashboard",
    "ops:dashboard",
    "admin:users",
    "admin:system",
    "audit:read",
    "clients:manage",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function requiresRole(role: UserRole, ...allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(role);
}

export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  candidate: "/status",
  ops_staff: "/ops",
  ops_admin: "/ops",
  bd: "/bd",
  system_admin: "/admin",
};
