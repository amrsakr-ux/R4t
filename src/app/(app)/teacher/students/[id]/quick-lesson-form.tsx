"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Attendance = "present" | "absent" | "postponed";
type Grade = "excellent" | "very_good" | "good" | "needs_review";

const GRADES: { value: Grade; label: string; cls: string }[] = [
  { value: "excellent", label: "ممتاز", cls: "border-secondary/40 bg-secondary/10 text-secondary" },
  { value: "very_good", label: "جيد جدًا", cls: "border-secondary/30 bg-secondary/5 text-secondary" },
  { value: "good", label: "جيد", cls: "border-accent/40 bg-accent/10 text-accent-foreground" },
  { value: "needs_review", label: "يحتاج مراجعة", cls: "border-destructive/30 bg-destructive/5 text-destructive" },
];

const ERROR_TYPES = ["تجويد", "نطق", "نسيان", "حركات"];

export function QuickLessonForm({ studentId, groupId }: { studentId: string; groupId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [attendance, setAttendance] = useState<Attendance>("present");
  const [hasNew, setHasNew] = useState(true);
  const [newPortion, setNewPortion] = useState("");
  const [reviewPortion, setReviewPortion] = useState("");
  const [errorsCount, setErrorsCount] = useState<number | "">("");
  const [errorsType, setErrorsType] = useState<string[]>([]);
  const [grade, setGrade] = useState<Grade>("very_good");
  const [homework, setHomework] = useState("");
  const [notes, setNotes] = useState("");

  function toggleErrorType(t: string) {
    setErrorsType((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function submit() {
    setError(null);
    const payload = {
      studentId,
      groupId,
      attendance,
      hasNewMemorization: attendance === "present" ? hasNew : false,
      newPortion: attendance === "present" && hasNew ? newPortion : "",
      reviewPortion: attendance === "present" ? reviewPortion : "",
      errorsCount: attendance === "present" && errorsCount !== "" ? Number(errorsCount) : null,
      errorsType: attendance === "present" ? errorsType.join(", ") : "",
      evaluation: attendance === "present" ? grade : null,
      homework,
      teacherNotes: notes,
    };

    startTransition(async () => {
      const res = await fetch("/api/teacher/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "تعذّر حفظ الحصة");
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.refresh();
        setSuccess(false);
      }, 800);
      setNewPortion(""); setReviewPortion(""); setErrorsCount(""); setErrorsType([]); setHomework(""); setNotes("");
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="space-y-4">
        <div>
          <Label className="mb-2 block text-xs">الحضور</Label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { v: "present", label: "حضور", icon: Check, cls: "border-secondary/40 bg-secondary/10 text-secondary" },
                { v: "postponed", label: "مؤجلة", icon: Clock, cls: "border-accent/40 bg-accent/10 text-accent-foreground" },
                { v: "absent", label: "غياب", icon: CircleAlert, cls: "border-destructive/30 bg-destructive/5 text-destructive" },
              ] as { v: Attendance; label: string; icon: typeof Check; cls: string }[]
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setAttendance(o.v)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-sm transition ${
                  attendance === o.v ? `${o.cls} font-semibold` : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                <o.icon className="h-4 w-4" />
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {attendance === "present" && (
          <>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <Label htmlFor="hasNew" className="text-sm">فيه حفظ جديد اليوم؟</Label>
              <input id="hasNew" type="checkbox" checked={hasNew} onChange={(e) => setHasNew(e.target.checked)} className="h-4 w-4 accent-primary" />
            </div>

            {hasNew && (
              <div className="space-y-1.5">
                <Label htmlFor="newPortion" className="text-xs">الحفظ الجديد</Label>
                <Input id="newPortion" value={newPortion} onChange={(e) => setNewPortion(e.target.value)} placeholder="مثال: آل عمران 1-10" />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="reviewPortion" className="text-xs">المراجعة</Label>
              <Input id="reviewPortion" value={reviewPortion} onChange={(e) => setReviewPortion(e.target.value)} placeholder="مثال: البقرة — ربع" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="errorsCount" className="text-xs">عدد الأخطاء</Label>
                <Input id="errorsCount" type="number" min={0} value={errorsCount} onChange={(e) => setErrorsCount(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">نوع الأخطاء</Label>
                <div className="flex flex-wrap gap-1.5">
                  {ERROR_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleErrorType(t)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        errorsType.includes(t) ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-2 block text-xs">التقييم العام</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GRADES.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGrade(g.value)}
                    className={`rounded-lg border py-2 text-sm transition ${grade === g.value ? `${g.cls} font-semibold` : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"}`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="homework" className="text-xs">الواجب للحصة القادمة</Label>
          <Input id="homework" value={homework} onChange={(e) => setHomework(e.target.value)} placeholder="مثال: تسميع الجديد + مراجعة ربع" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs">ملاحظات (اختياري)</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>
        )}

        <Button type="button" onClick={submit} disabled={pending} className="w-full bg-primary hover:bg-primary/90">
          {pending ? "جارٍ الحفظ..." : success ? "✓ تم الحفظ" : "حفظ الحصة"}
        </Button>
      </div>
    </div>
  );
}
