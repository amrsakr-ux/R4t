import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { GroupForm } from "./group-form";

export const dynamic = "force-dynamic";

export default async function NewGroupPage() {
  const [teachers, programs] = await Promise.all([
    prisma.teacher.findMany({ include: { user: { select: { fullName: true } } }, orderBy: { joinedAt: "desc" } }),
    prisma.program.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="إنشاء حلقة جديدة" description="حددي المعلمة والبرنامج والمواعيد الأسبوعية." />
      <div className="max-w-3xl rounded-2xl border border-border bg-card p-6">
        <GroupForm
          teachers={teachers.map((t) => ({ id: t.id, name: t.user.fullName }))}
          programs={programs.map((p) => ({ id: p.id, name: p.name }))}
        />
      </div>
    </div>
  );
}
