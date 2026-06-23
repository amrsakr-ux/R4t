import { Header } from "@/components/layout/header";
import { CandidateListView } from "@/components/ops/candidate-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function CandidatesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Candidates"
        description="Manage and review all candidate applications"
        actions={
          <Link href="/ops/candidates/invite">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Invite Candidate
            </Button>
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <CandidateListView />
      </div>
    </div>
  );
}
