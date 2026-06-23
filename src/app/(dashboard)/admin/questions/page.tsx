import { Header } from "@/components/layout/header";
import { QuestionManager } from "@/components/ops/question-manager";

export default function AdminQuestionsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Assessment Questions" description="Configure the assessment questions for candidates" />
      <div className="flex-1 overflow-auto p-6">
        <QuestionManager />
      </div>
    </div>
  );
}
