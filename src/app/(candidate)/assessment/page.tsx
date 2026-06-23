"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  category: string;
  displayOrder: number;
}


function AssessmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get("candidateId") || "";
  const { toast } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((d) => {
        setQuestions(d.data || []);
        setLoading(false);
      });
  }, []);

  const current = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const handleNext = () => {
    if (!responses[current?.id]?.trim() || responses[current?.id]?.trim().length < 10) {
      toast({ title: "Please provide a more detailed answer (min 10 characters)", variant: "destructive" });
      return;
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  const handleSubmit = async () => {
    if (!responses[current?.id]?.trim() || responses[current?.id]?.trim().length < 10) {
      toast({ title: "Please provide a more detailed answer", variant: "destructive" });
      return;
    }

    const allAnswered = questions.every((q) => responses[q.id]?.trim());
    if (!allAnswered) {
      toast({ title: "Please answer all questions", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: Object.entries(responses).map(([questionId, responseText]) => ({
            questionId,
            responseText,
          })),
        }),
      });

      if (res.ok) {
        toast({ title: "Assessment submitted!" });
        router.push(`/cv-upload?candidateId=${candidateId}`);
      } else {
        const err = await res.json();
        toast({ title: "Submission failed", description: err.error, variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
        <p className="text-blue-200">Loading assessment questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center">
        <Card className="bg-white/10 backdrop-blur border-white/20">
          <CardContent className="pt-8 pb-8">
            <p className="text-white">No assessment questions available. Proceeding to CV upload...</p>
            <Button className="mt-4 bg-blue-500" onClick={() => router.push(`/cv-upload?candidateId=${candidateId}`)}>
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLast = currentIndex === questions.length - 1;
  const categoryColors: Record<string, string> = {
    motivation: "bg-green-500/20 text-green-300",
    goals: "bg-blue-500/20 text-blue-300",
    challenges: "bg-yellow-500/20 text-yellow-300",
    experience: "bg-purple-500/20 text-purple-300",
    skills: "bg-pink-500/20 text-pink-300",
    preferences: "bg-indigo-500/20 text-indigo-300",
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-blue-300 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Card className="bg-white/10 backdrop-blur border-white/20">
        <CardContent className="pt-8 pb-6 space-y-6">
          {/* Category badge */}
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${categoryColors[current.category] || "bg-gray-500/20 text-gray-300"}`}>
            {current.category.charAt(0).toUpperCase() + current.category.slice(1)}
          </span>

          {/* Question */}
          <h2 className="text-xl font-semibold text-white leading-relaxed">
            {current.questionText}
          </h2>

          {/* Answer */}
          <Textarea
            value={responses[current.id] || ""}
            onChange={(e) => setResponses({ ...responses, [current.id]: e.target.value })}
            placeholder="Share your thoughts in detail... (minimum 10 characters)"
            rows={6}
            className="bg-white/10 border-white/20 text-white placeholder:text-blue-300 resize-none"
          />

          <div className="text-right text-xs text-blue-400">
            {(responses[current.id] || "").length} characters
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentIndex > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(i => i - 1)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
            )}
            <Button
              className="flex-1 bg-blue-500 hover:bg-blue-600"
              onClick={isLast ? handleSubmit : handleNext}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</>
              ) : isLast ? (
                <><CheckCircle className="w-4 h-4 mr-1" /> Submit Assessment</>
              ) : (
                <>Next Question <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions overview */}
      <div className="flex justify-center gap-1.5 mt-4">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === currentIndex ? "bg-blue-400" : responses[questions[i].id] ? "bg-blue-600" : "bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
      <AssessmentForm />
    </Suspense>
  );
}
