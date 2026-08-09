"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Initial = {
  currentSurah: string; currentAyahFrom: number | ""; currentAyahTo: number | "";
  reviewSurah: string; reviewAyahFrom: number | ""; reviewAyahTo: number | "";
  progressPct: number; notes: string;
};

const EMPTY: Initial = {
  currentSurah: "", currentAyahFrom: "", currentAyahTo: "",
  reviewSurah: "", reviewAyahFrom: "", reviewAyahTo: "",
  progressPct: 0, notes: "",
};

export function PlanForm({ studentId, initial }: { studentId: string; initial: Initial | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<Initial>(initial ?? EMPTY);

  function set<K extends keyof Initial>(k: K, v: Initial[K]) { setF((prev) => ({ ...prev, [k]: v })); }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/teacher/plans/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSurah: f.currentSurah || null,
          currentAyahFrom: f.currentAyahFrom === "" ? null : Number(f.currentAyahFrom),
          currentAyahTo: f.currentAyahTo === "" ? null : Number(f.currentAyahTo),
          reviewSurah: f.reviewSurah || null,
          reviewAyahFrom: f.reviewAyahFrom === "" ? null : Number(f.reviewAyahFrom),
          reviewAyahTo: f.reviewAyahTo === "" ? null : Number(f.reviewAyahTo),
          progressPct: Number(f.progressPct) || 0,
          notes: f.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "تعذّر الحفظ");
      router.push(`/teacher/students/${studentId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-semibold text-primary">الحفظ الجديد</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1 space-y-1.5">
            <Label htmlFor="cs">السورة</Label>
            <Input id="cs" value={f.currentSurah} onChange={(e) => set("currentSurah", e.target.value)} placeholder="مثال: آل عمران" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf">من آية</Label>
            <Input id="cf" type="number" min={1} value={f.currentAyahFrom} onChange={(e) => set("currentAyahFrom", e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct">إلى آية</Label>
            <Input id="ct" type="number" min={1} value={f.currentAyahTo} onChange={(e) => set("currentAyahTo", e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-semibold text-primary">المراجعة</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1 space-y-1.5">
            <Label htmlFor="rs">السورة</Label>
            <Input id="rs" value={f.reviewSurah} onChange={(e) => set("reviewSurah", e.target.value)} placeholder="مثال: البقرة" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rf">من آية</Label>
            <Input id="rf" type="number" min={1} value={f.reviewAyahFrom} onChange={(e) => set("reviewAyahFrom", e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rt">إلى آية</Label>
            <Input id="rt" type="number" min={1} value={f.reviewAyahTo} onChange={(e) => set("reviewAyahTo", e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
        </div>
      </fieldset>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="pct">نسبة التقدم</Label>
          <span className="text-sm font-semibold text-primary">{f.progressPct}%</span>
        </div>
        <input id="pct" type="range" min={0} max={100} value={f.progressPct} onChange={(e) => set("progressPct", Number(e.target.value))} className="w-full accent-primary" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">ملاحظات (اختياري)</Label>
        <Textarea id="notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      <div className="flex gap-3">
        <Button type="button" onClick={submit} disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? "جارٍ الحفظ..." : "حفظ الخطة"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>إلغاء</Button>
      </div>
    </div>
  );
}
