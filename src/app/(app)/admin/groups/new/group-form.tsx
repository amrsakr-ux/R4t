"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

type Opt = { id: string; name: string };
type Slot = { dayOfWeek: number; startTime: string; durationMins: number };

const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function GroupForm({ teachers, programs }: { teachers: Opt[]; programs: Opt[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([{ dayOfWeek: 6, startTime: "06:00", durationMins: 45 }]);

  function addSlot() {
    setSlots([...slots, { dayOfWeek: 3, startTime: "18:00", durationMins: 45 }]);
  }
  function removeSlot(i: number) {
    setSlots(slots.filter((_, idx) => idx !== i));
  }
  function updateSlot(i: number, patch: Partial<Slot>) {
    setSlots(slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name"),
      teacherId: fd.get("teacherId") || null,
      programId: fd.get("programId") || null,
      meetLink: fd.get("meetLink") || null,
      maxStudents: Number(fd.get("maxStudents")) || 10,
      schedules: slots,
    };
    startTransition(async () => {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "تعذّر الحفظ");
      router.push("/admin/groups");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">اسم الحلقة <span className="text-destructive">*</span></Label>
          <Input id="name" name="name" required placeholder="مثال: حلقة الفجر 1" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxStudents">الحد الأقصى للطالبات</Label>
          <Input id="maxStudents" name="maxStudents" type="number" min={1} defaultValue={10} />
        </div>
        <Select label="المعلمة" name="teacherId" options={teachers} placeholder="اختاري المعلمة" />
        <Select label="البرنامج" name="programId" options={programs} placeholder="اختاري البرنامج" />
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="meetLink">رابط الحصة (اختياري)</Label>
          <Input id="meetLink" name="meetLink" dir="ltr" placeholder="https://meet.google.com/..." />
          <p className="text-xs text-muted-foreground">يمكن للمعلمة تحديثه لاحقًا لكل حصة.</p>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label>المواعيد الأسبوعية</Label>
          <Button type="button" variant="outline" size="sm" onClick={addSlot}>
            <Plus className="ms-1 h-4 w-4" />
            إضافة موعد
          </Button>
        </div>
        <div className="space-y-2">
          {slots.map((s, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="min-w-[140px] flex-1 space-y-1">
                <Label className="text-xs">اليوم</Label>
                <select
                  value={s.dayOfWeek}
                  onChange={(e) => updateSlot(i, { dayOfWeek: Number(e.target.value) })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {DAYS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
                </select>
              </div>
              <div className="min-w-[110px] flex-1 space-y-1">
                <Label className="text-xs">الساعة</Label>
                <Input type="time" value={s.startTime} onChange={(e) => updateSlot(i, { startTime: e.target.value })} dir="ltr" />
              </div>
              <div className="min-w-[110px] flex-1 space-y-1">
                <Label className="text-xs">المدة (دقيقة)</Label>
                <Input type="number" min={15} step={5} value={s.durationMins} onChange={(e) => updateSlot(i, { durationMins: Number(e.target.value) })} />
              </div>
              {slots.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeSlot(i)} className="text-destructive">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? "جارٍ الحفظ..." : "إنشاء الحلقة"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>إلغاء</Button>
      </div>
    </form>
  );
}

function Select({ label, name, options, placeholder }: { label: string; name: string; options: Opt[]; placeholder: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue=""
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  );
}
