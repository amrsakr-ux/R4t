import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { CandidateDetailView } from "@/components/ops/candidate-detail";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

async function getCandidate(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/candidates/${id}`, {
      cache: "no-store",
    });
    if (res.ok) return (await res.json()).data;
  } catch {}
  return null;
}

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, candidate] = await Promise.all([auth(), getCandidate(id)]);

  if (!candidate) notFound();

  return (
    <div className="flex flex-col h-full">
      <Header
        title={candidate.user.fullName}
        description={candidate.user.email}
        actions={
          <Link href="/ops/candidates">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to List
            </Button>
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <CandidateDetailView
          candidate={candidate}
          currentUserRole={session?.user.role || "ops_staff"}
        />
      </div>
    </div>
  );
}
