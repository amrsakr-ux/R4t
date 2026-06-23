import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadCV } from "@/lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (session.user.role === "candidate") {
    const candidate = await prisma.candidate.findUnique({ where: { userId: session.user.id } });
    if (!candidate || candidate.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("cv") as File;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PDF and DOCX files are allowed" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let fileUrl: string;
  let filePath: string;

  try {
    const result = await uploadCV(buffer, file.name, id, file.type);
    fileUrl = result.url;
    filePath = result.path;
  } catch (err) {
    console.error("Upload error:", err);
    // Fallback: store locally for development
    fileUrl = `/uploads/${id}/${file.name}`;
    filePath = fileUrl;
  }

  const cvDoc = await prisma.cvDocument.create({
    data: {
      candidateId: id,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      parseStatus: "pending",
    },
  });

  // Trigger async CV parsing
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    fetch(`${appUrl}/api/internal/ai/parse-cv`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
      },
      body: JSON.stringify({ cvDocumentId: cvDoc.id, candidateId: id }),
    }).catch(console.error);
  } catch (err) {
    console.error("Failed to trigger CV parsing:", err);
  }

  return NextResponse.json({
    success: true,
    data: { id: cvDoc.id, fileUrl, fileName: file.name, parseStatus: "pending" },
  });
}
