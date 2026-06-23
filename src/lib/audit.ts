import { prisma } from "./prisma";

interface AuditLogEntry {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export async function logStatusChange(
  userId: string,
  candidateId: string,
  fromStatus: string,
  toStatus: string,
  reason?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: "status_changed",
    entityType: "candidate",
    entityId: candidateId,
    metadata: { from: fromStatus, to: toStatus, reason },
  });
}

export async function logExport(
  userId: string,
  entityType: string,
  count: number,
  filters?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    userId,
    action: "data_exported",
    entityType,
    entityId: userId,
    metadata: { count, filters },
  });
}
