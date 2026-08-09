"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MeetLinkForm({ groupId, initialLink }: { groupId: string; initialLink: string }) {
  const router = useRouter();
  const [link, setLink] = useState(initialLink);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await fetch(`/api/teacher/groups/${groupId}/meet-link`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetLink: link }),
      });
      const data = await res.json();
      if (!res.ok) return setMsg(data.error || "تعذّر الحفظ");
      setMsg("✓ تم الحفظ");
      router.refresh();
      setTimeout(() => setMsg(null), 1500);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." dir="ltr" className="text-sm" />
        <Button type="button" size="sm" onClick={save} disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? "..." : "حفظ"}
        </Button>
      </div>
      {msg && <div className="text-xs text-muted-foreground">{msg}</div>}
    </div>
  );
}
