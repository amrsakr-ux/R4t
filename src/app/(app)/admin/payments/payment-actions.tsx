"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Eye } from "lucide-react";

export function PaymentActions({ paymentId, proofUrl }: { paymentId: string; proofUrl: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function update(action: "confirm" | "reject") {
    startTransition(async () => {
      await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      {proofUrl && (
        <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary" title="عرض الإثبات">
          <Eye className="h-4 w-4" />
        </a>
      )}
      <Button size="sm" variant="ghost" className="h-8 gap-1 text-secondary hover:bg-secondary/10" onClick={() => update("confirm")} disabled={pending}>
        <Check className="h-4 w-4" />
        تأكيد
      </Button>
      <Button size="sm" variant="ghost" className="h-8 gap-1 text-destructive hover:bg-destructive/10" onClick={() => update("reject")} disabled={pending}>
        <X className="h-4 w-4" />
        رفض
      </Button>
    </div>
  );
}
