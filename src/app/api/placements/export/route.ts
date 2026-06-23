import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logExport } from "@/lib/audit";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ops_staff", "ops_admin", "bd", "system_admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";
  const clientId = searchParams.get("clientId");
  const status = searchParams.getAll("status");

  const where: Record<string, unknown> = {};
  if (clientId) where.clientId = clientId;
  if (status.length > 0) where.placementStatus = { in: status };

  const placements = await prisma.placement.findMany({
    where,
    include: {
      candidate: { include: { user: { select: { fullName: true, email: true } } } },
      client: true,
      jobOpportunity: { select: { title: true, jobTrack: true } },
    },
    orderBy: { placementDate: "desc" },
  });

  await logExport(session.user.id, "placements", placements.length, { clientId, status });

  if (format === "csv") {
    const headers = ["Candidate Name", "Email", "Job Title", "Client", "Project", "Placement Date", "Status", "Track"];
    const rows = placements.map((p) => [
      p.candidate.user.fullName,
      p.candidate.user.email,
      p.jobTitle,
      p.client.name,
      p.projectName || "",
      new Date(p.placementDate).toISOString().split("T")[0],
      p.placementStatus,
      p.jobOpportunity?.jobTrack || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="placements-${Date.now()}.csv"`,
      },
    });
  }

  // Excel format
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Placements");

  worksheet.columns = [
    { header: "Candidate Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Job Title", key: "jobTitle", width: 25 },
    { header: "Client", key: "client", width: 25 },
    { header: "Project", key: "project", width: 25 },
    { header: "Placement Date", key: "date", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Track", key: "track", width: 20 },
  ];

  // Style the header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E40AF" },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  placements.forEach((p) => {
    worksheet.addRow({
      name: p.candidate.user.fullName,
      email: p.candidate.user.email,
      jobTitle: p.jobTitle,
      client: p.client.name,
      project: p.projectName || "",
      date: new Date(p.placementDate).toISOString().split("T")[0],
      status: p.placementStatus,
      track: p.jobOpportunity?.jobTrack || "",
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="placements-${Date.now()}.xlsx"`,
    },
  });
}
