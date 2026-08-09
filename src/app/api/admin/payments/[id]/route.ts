import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

const schema = z.object({ action: z.enum(["confirm", "reject"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "action غير صحيح" }, { status: 400 });

  await prisma.payment.update({
    where: { id },
    data: {
      status: parsed.data.action === "confirm" ? "confirmed" : "rejected",
      confirmedAt: new Date(),
      confirmedBy: session!.id,
    },
  });

  return NextResponse.json({ ok: true });
}
