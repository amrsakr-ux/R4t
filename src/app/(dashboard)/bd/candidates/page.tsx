import { Header } from "@/components/layout/header";
import { BDCandidatePool } from "@/components/bd/candidate-pool";

export default function BDCandidatesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Candidate Pool" description="Search and filter qualified candidates for client matching" />
      <div className="flex-1 overflow-auto p-6">
        <BDCandidatePool />
      </div>
    </div>
  );
}
