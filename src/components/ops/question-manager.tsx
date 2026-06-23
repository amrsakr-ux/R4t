"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  questionText: string;
  category: string;
  isActive: boolean;
  displayOrder: number;
}

const CATEGORY_OPTIONS = ["motivation", "goals", "challenges", "experience", "skills", "preferences"];
const CATEGORY_COLORS: Record<string, string> = {
  motivation: "bg-green-100 text-green-800",
  goals: "bg-blue-100 text-blue-800",
  challenges: "bg-yellow-100 text-yellow-800",
  experience: "bg-purple-100 text-purple-800",
  skills: "bg-pink-100 text-pink-800",
  preferences: "bg-indigo-100 text-indigo-800",
};

export function QuestionManager() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [form, setForm] = useState({ questionText: "", category: "motivation", displayOrder: 1 });

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/questions");
      if (res.ok) setQuestions((await res.json()).data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: "Question created" });
        setShowCreate(false);
        setForm({ questionText: "", category: "motivation", displayOrder: 1 });
        fetchQuestions();
      }
    } catch {
      toast({ title: "Error creating question", variant: "destructive" });
    }
  };

  const handleToggleActive = async (q: Question) => {
    try {
      await fetch("/api/admin/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: q.id, isActive: !q.isActive }),
      });
      toast({ title: `Question ${q.isActive ? "deactivated" : "activated"}` });
      fetchQuestions();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{questions.filter(q => q.isActive).length} active questions</p>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Question
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading questions...</div>
        ) : questions.map((q, i) => (
          <Card key={q.id} className={`p-4 ${!q.isActive ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3">
              <span className="text-gray-400 text-sm font-mono w-6 flex-shrink-0">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[q.category] || "bg-gray-100 text-gray-800"}`}>
                    {q.category}
                  </span>
                  {!q.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                </div>
                <p className="text-sm text-gray-800">{q.questionText}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={() => handleToggleActive(q)}>
                  {q.isActive ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Assessment Question</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Question Text *</Label>
              <Textarea value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} rows={3} placeholder="Write your question here..." />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Display Order</Label>
              <Input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 1 })} min={1} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Question</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
