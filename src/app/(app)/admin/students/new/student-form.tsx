"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";

type Opt = { id: string; name: string };

const AR_TO_EN: Record<string, string> = {
  ا: "a", أ: "a", إ: "e", آ: "a", ء: "", ب: "b", ت: "t", ث: "th",
  ج: "g", ح: "h", خ: "kh", د: "d", ذ: "z", ر: "r", ز: "z", س: "s",
  ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f",
  ق: "q", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", و: "w", ي: "y",
  ى: "a", ة: "a", ؤ: "o", ئ: "e", " ": "_",
};

function suggestUsername(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = (parts[0] ?? "")
    .split("")
    .map((c) => AR_TO_EN[c] ?? c.toLowerCase())
    .join("")
    .replace(/[^a-z0-9_]/g, "");
  const base = first || "user";
  const suffix = String(Math.floor(10 + Math.random() * 90));
  return `sana_${base}${suffix}`;
}

export function StudentForm({
  programs, groups, academicYears, defaultAcademicYear,
}: {
  programs: Opt[]; groups: Opt[]; academicYears: string[]; defaultAcademicYear: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (fullName && !username) setUsername(suggestUsername(fullName));
  }, [fullName]); // eslint-disable-line react-hooks/exhaustive-deps

  function regenerate() {
    setUsername(suggestUsername(fullName));
  }

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
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold text-primary">بيانات الحساب</legend>
        <Field label="الاسم الكامل" name="fullName" required value={fullName} onChange={(v) => setFullName(v)} />

        <div className="space-y-2">
          <Label htmlFor="username">اسم المستخدم <span className="text-destructive">*</span></Label>
          <div className="flex gap-2">
            <Input id="username" name="username" required dir="ltr" value={username} onChange={(e) => setUsername(e.target.value)} className="text-right" />
            <Button type="button" variant="outline" size="icon" onClick={regenerate} title="توليد اسم مستخدم جديد">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">هذا ما تستخدمه الطالبة لتسجيل الدخول.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="كلمة المرور المبدئية" name="password" required helper="ستُطلب من الطالبة تغييرها عند أول دخول" />
          <Field label="البريد الإلكتروني (اختياري)" name="email" type="email" dir="ltr" />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold text-primary">بيانات التواصل</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="رقم الهاتف" name="phone" dir="ltr" />
          <Field label="اسم ولي الأمر" name="guardianName" />
          <Field label="هاتف ولي الأمر" name="guardianPhone" dir="ltr" />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold text-primary">التسجيل السنوي</legend>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="academicYear">العام الدراسي</Label>
            <select
              id="academicYear"
              name="academicYear"
              defaultValue={defaultAcademicYear}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {academicYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <SelectField label="البرنامج" name="programId" options={programs} placeholder="اختاري البرنامج" />
          <SelectField label="الحلقة" name="groupId" options={groups} placeholder="اختاري الحلقة" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">ملاحظات</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>
      </fieldset>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? "جارٍ الحفظ..." : "حفظ الطالبة"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>إلغاء</Button>
      </div>
    </form>
  );
}

function Field({
  label, name, type = "text", required, helper, dir, value, onChange,
}: { label: string; name: string; type?: string; required?: boolean; helper?: string; dir?: "ltr" | "rtl"; value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        dir={dir}
        {...(value !== undefined ? { value, onChange: (e) => onChange?.(e.target.value) } : {})}
      />
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
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        defaultValue=""
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  );
}
