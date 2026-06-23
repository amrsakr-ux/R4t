import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  educationLevel: z.string().optional(),
  graduationStatus: z.enum(["graduated", "in_progress", "not_started"]).optional(),
  careerInterests: z.array(z.string()).optional(),
  preferredJobTracks: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = RegisterSchema.parse(body);

    // Verify invite token
    const existing = await prisma.candidate.findUnique({
      where: { applicationLinkToken: data.token },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Invalid or expired invitation token" }, { status: 400 });
    }

    if (existing.status !== "invited") {
      return NextResponse.json({ error: "This invitation has already been used" }, { status: 400 });
    }

    // Check email uniqueness
    const emailUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailUser && emailUser.id !== existing.userId) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: existing.userId },
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
        },
      }),
      prisma.candidate.update({
        where: { id: existing.id },
        data: {
          phone: data.phone,
          educationLevel: data.educationLevel,
          graduationStatus: data.graduationStatus,
          careerInterests: data.careerInterests || [],
          preferredJobTracks: data.preferredJobTracks || [],
          status: "registered",
        },
      }),
    ]);

    return NextResponse.json({ success: true, candidateId: existing.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
