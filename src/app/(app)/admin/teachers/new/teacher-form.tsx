"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";

const AR_TO_EN: Record<string, string> = {
  ا: "a", أ: "a", إ: "e", آ: "a", ء: "", ب: "b", ت: "t", ث: "th",
  ج: "g", ح: "h", خ: "kh", د: "d", ذ: "z", ر: "r", ز: "z", س: "s",
  ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f",
  ق: "q", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", و: "w", ي: "y",
  ى: "a", ة: "a", ؤ: "o", ئ: "e", " ": "_",
};

function suggestUsername(fullName: string): string {
  const first = (fullName.trim().split(/\s+/)[0] ?? "")
    .split("").map((c) => AR_TO_EN[c] ?? c.toLowerCase()).join("")
    .replace(/[^a-z0-9_]/g, "");
  const base = first || "teacher";
  return `sana_t_${base}${Math.floor(10 + Math.random() * 90)}`;
}

export function TeacherForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (fullName && !username) setUsername(suggestUsername(fullName));
  }, [fullName]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="space-y-2">
        <Label htmlFor="fullName">الاسم الكامل <span className="text-destructive">*</span></Label>
        <Input id="fullName" name="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">اسم المستخدم <span className="text-destructive">*</span></Label>
        <div className="flex gap-2">
          <Input id="username" name="username" required dir="ltr" value={username} onChange={(e) => setUsername(e.target.value)} className="text-right" />
          <Button type="button" variant="outline" size="icon" onClick={() => setUsername(suggestUsername(fullName))}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <F label="كلمة المرور المبدئية" name="password" required />
        <F label="البريد الإلكتروني (اختياري)" name="email" type="email" dir="ltr" />
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
