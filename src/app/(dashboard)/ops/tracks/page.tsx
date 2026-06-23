import { Header } from "@/components/layout/header";
import { JobTracksView } from "@/components/ops/job-tracks-view";

export default function TracksPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Job Tracks & Opportunities" description="Manage job opportunities and track configurations" />
      <div className="flex-1 overflow-auto p-6">
        <JobTracksView />
      </div>
    </div>
  );
}
