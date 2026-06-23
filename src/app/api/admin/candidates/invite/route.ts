import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/utils";
import { z } from "zod";

const InviteSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_staff", "ops_admin", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { fullName, email } = InviteSchema.parse(body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

  const token = generateToken();
  const tempPassword = await bcrypt.hash(generateToken().slice(0, 12), 12);

  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      role: "candidate",
      passwordHash: tempPassword,
      isActive: true,
    },
  });

  const candidate = await prisma.candidate.create({
    data: {
      userId: user.id,
      applicationLinkToken: token,
      status: "invited",
      careerInterests: [],
      preferredJobTracks: [],
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${appUrl}/apply/${token}`;

  return NextResponse.json({
    success: true,
    data: { candidateId: candidate.id, inviteUrl, token },
  });
}
