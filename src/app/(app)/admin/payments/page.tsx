import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDateAr } from "@/lib/utils";
import { PaymentActions } from "./payment-actions";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: {
      student: { include: { user: { select: { fullName: true, email: true } } } },
    },
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
    take: 100,
  });

  const pendingCount = payments.filter((p) => p.status === "pending").length;

  return (
    <div>
      <PageHeader
        title="المدفوعات"
        description={`${pendingCount} دفعة بانتظار المراجعة`}
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-right text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">الطالبة</th>
              <th className="p-3">الشهر</th>
              <th className="p-3">المبلغ</th>
              <th className="p-3">الطريقة</th>
              <th className="p-3">التاريخ</th>
              <th className="p-3">الحالة</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  لا توجد مدفوعات بعد.
                </td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                <td className="p-3">
                  <div className="font-medium">{p.student.user.fullName}</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">{p.student.user.email}</div>
                </td>
                <td className="p-3" dir="ltr">{p.monthCovered}</td>
                <td className="p-3 font-medium">{p.amount.toString()} {p.currency}</td>
                <td className="p-3">{p.method}</td>
                <td className="p-3 text-muted-foreground">{formatDateAr(p.submittedAt)}</td>
                <td className="p-3"><StatusBadge status={p.status} /></td>
                <td className="p-3">
                  {p.status === "pending" && <PaymentActions paymentId={p.id} proofUrl={p.proofUrl} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") return <Badge className="bg-secondary/20 text-secondary hover:bg-secondary/20">مؤكدة</Badge>;
  if (status === "rejected") return <Badge variant="destructive">مرفوضة</Badge>;
  return <Badge className="bg-accent/20 text-accent-foreground hover:bg-accent/20">قيد المراجعة</Badge>;
}
