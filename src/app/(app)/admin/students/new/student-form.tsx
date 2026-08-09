"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Opt = { id: string; name: string };

export function StudentForm({ programs, groups }: { programs: Opt[]; groups: Opt[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    startTransition(async () => {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "تعذّر حفظ الطالبة");
      router.push("/admin/students");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="الاسم الكامل" name="fullName" required />
        <Field label="البريد الإلكتروني" name="email" type="email" required dir="ltr" />
        <Field label="كلمة المرور المبدئية" name="password" type="text" required helper="ستطلبين من الطالبة تغييرها لاحقًا" />
        <Field label="رقم الهاتف" name="phone" dir="ltr" />
        <SelectField label="البرنامج" name="programId" options={programs} placeholder="اختاري البرنامج" />
        <SelectField label="الحلقة" name="groupId" options={groups} placeholder="اختاري الحلقة" />
        <Field label="اسم ولي الأمر" name="guardianName" />
        <Field label="هاتف ولي الأمر" name="guardianPhone" dir="ltr" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">ملاحظات</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? "جارٍ الحفظ..." : "حفظ الطالبة"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}

function Field({
  label, name, type = "text", required, helper, dir,
}: { label: string; name: string; type?: string; required?: boolean; helper?: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input id={name} name={name} type={type} required={required} dir={dir} />
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

function SelectField({ label, name, options, placeholder }: { label: string; name: string; options: Opt[]; placeholder: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        defaultValue=""
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </div>
  );
}
