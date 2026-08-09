import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log("Seed skipped: admin already exists.");
    return;
  }

  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      username,
      email: "admin@sana-academy.com",
      passwordHash,
      role: UserRole.admin,
      fullName: "مدير النظام",
      mustChangePassword: true,
      admin: { create: {} },
    },
  });

  const programs = await prisma.$transaction([
    prisma.program.create({ data: { name: "برنامج الحفظ", slug: "hifz" } }),
    prisma.program.create({ data: { name: "برنامج المراجعة والتثبيت", slug: "review" } }),
    prisma.program.create({ data: { name: "برنامج الإجازة في القرآن الكريم", slug: "ijazah" } }),
  ]);

  console.log("Seeded admin:", admin.username);
  console.log("Seeded programs:", programs.map((p) => p.name).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
