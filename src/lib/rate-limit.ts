import { createHash } from "crypto";
import { prisma } from "./prisma";

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS_PER_IP = 20;
const MAX_ATTEMPTS_PER_USERNAME = 5;

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function checkLoginRateLimit(ip: string, username: string) {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000);
  const ipHash = hashIp(ip);

  const [ipFailures, userFailures] = await Promise.all([
    prisma.loginAttempt.count({ where: { ipHash, success: false, createdAt: { gte: since } } }),
    prisma.loginAttempt.count({ where: { username, success: false, createdAt: { gte: since } } }),
  ]);

  if (ipFailures >= MAX_ATTEMPTS_PER_IP) {
    return { ok: false, reason: "too many attempts from this network" };
  }
  if (userFailures >= MAX_ATTEMPTS_PER_USERNAME) {
    return { ok: false, reason: "too many failed attempts for this account" };
  }
  return { ok: true };
}

export async function recordLoginAttempt(ip: string, username: string, success: boolean) {
  await prisma.loginAttempt.create({
    data: { ipHash: hashIp(ip), username, success },
  });
}
