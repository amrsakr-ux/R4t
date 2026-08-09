import { PageHeader } from "@/components/page-header";
import { TeacherForm } from "./teacher-form";

export default function NewTeacherPage() {
  return (
    <div>
      <PageHeader title="إضافة معلمة جديدة" />
      <div className="max-w-2xl rounded-2xl border border-border bg-card p-6">
        <TeacherForm />
      </div>
    </div>
  );
}
