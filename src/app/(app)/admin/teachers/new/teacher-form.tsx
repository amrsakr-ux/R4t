"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TeacherForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    startTransition(async () => {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "تعذّر الحفظ");
      router.push("/admin/teachers");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <F label="الاسم الكامل" name="fullName" required />
        <F label="البريد الإلكتروني" name="email" type="email" required dir="ltr" />
        <F label="كلمة المرور المبدئية" name="password" required />
        <F label="رقم الهاتف" name="phone" dir="ltr" />
        <F label="التخصص" name="specialty" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">نبذة</Label>
        <Textarea id="bio" name="bio" rows={3} />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? "جارٍ الحفظ..." : "حفظ المعلمة"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>إلغاء</Button>
      </div>
    </form>
  );
}

function F({ label, name, type = "text", required, dir }: { label: string; name: string; type?: string; required?: boolean; dir?: "ltr" | "rtl" }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input id={name} name={name} type={type} required={required} dir={dir} />
    </div>
  );
}
