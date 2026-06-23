import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const StatusSchema = z.object({
  status: z.enum(["invited", "registered", "assessed", "scored", "shortlisted", "placed", "rejected"]),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_staff", "ops_admin", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, reason, notes } = StatusSchema.parse(body);

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    select: { status: true, notes: true },
  });

  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  const updateData: Record<string, unknown> = { status };
  if (notes !== undefined) updateData.notes = notes;

  const updated = await prisma.candidate.update({
    where: { id },
    data: updateData,
  });

  await createAuditLog({
    userId: session.user.id,
    action: "status_changed",
    entityType: "candidate",
    entityId: id,
    metadata: {
      from: candidate.status,
      to: status,
      reason,
    },
  });

  return NextResponse.json({ data: updated });
}
