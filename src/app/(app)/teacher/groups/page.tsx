import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTeacherIdForSession } from "@/lib/teacher-auth";
import { currentAcademicYear } from "@/lib/academic-year";
import { dayNameAr } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { MeetLinkForm } from "./meet-link-form";

export const dynamic = "force-dynamic";

const PROVIDER_LABELS: Record<string, string> = {
  google_meet: "Google Meet", zoom: "Zoom", discord: "Discord", teams: "Microsoft Teams", other: "أخرى",
};

export default async function TeacherGroupsPage() {
  const teacherId = await getTeacherIdForSession();
  if (!teacherId) redirect("/login");
  const year = currentAcademicYear();

  const groups = await prisma.group.findMany({
    where: { teacherId, isActive: true },
    include: {
      schedules: true,
      enrollments: { where: { academicYear: year, status: "active" }, select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="حلقاتي" description={`${groups.length} حلقة نشطة`} />
      {groups.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          لم يتم إسناد أي حلقات لكِ بعد.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="font-semibold text-primary">{g.name}</div>
                <div className="text-xs text-muted-foreground">{PROVIDER_LABELS[g.meetingProvider]}</div>
              </div>
              <Link href={`/teacher/students?group=${g.id}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Users className="h-3 w-3" />
                {g.enrollments.length} طالبة
              </Link>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {g.schedules.map((s) => (
                <span key={s.id} className="rounded-full bg-muted px-3 py-1 text-xs">
                  {dayNameAr(s.dayOfWeek)} — <span dir="ltr">{s.startTime}</span>
                </span>
              ))}
            </div>

            {g.meetLink ? (
              <a href={g.meetLink} target="_blank" rel="noopener noreferrer"
                className="mb-3 flex items-center gap-1.5 rounded-lg border border-secondary/40 bg-secondary/10 px-3 py-2 text-sm text-secondary hover:bg-secondary/15">
                <ExternalLink className="h-3.5 w-3.5" />
                دخول اللقاء الحالي
              </a>
            ) : (
              <div className="mb-3 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent-foreground">
                لم يتم تحديد رابط لقاء لهذه الحلقة بعد.
              </div>
            )}

            <MeetLinkForm groupId={g.id} initialLink={g.meetLink ?? ""} />
          </div>
        ))}
      </div>
    </div>
  );
}
