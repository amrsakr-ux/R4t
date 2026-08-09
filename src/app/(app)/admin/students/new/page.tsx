import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StudentForm } from "./student-form";

export const dynamic = "force-dynamic";

export default async function NewStudentPage() {
  const [programs, groups] = await Promise.all([
    prisma.program.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.group.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="إضافة طالبة جديدة" description="أنشئي حسابًا جديدًا للطالبة." />
      <div className="max-w-2xl rounded-2xl border border-border bg-card p-6">
        <StudentForm
          programs={programs.map((p) => ({ id: p.id, name: p.name }))}
          groups={groups.map((g) => ({ id: g.id, name: g.name }))}
        />
      </div>
    </div>
  );
}
