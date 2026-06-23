import { Header } from "@/components/layout/header";
import { QuestionManager } from "@/components/ops/question-manager";

export default function QuestionsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Assessment Questions" description="Manage the assessment questions shown to candidates" />
      <div className="flex-1 overflow-auto p-6">
        <QuestionManager />
      </div>
    </div>
  );
}
