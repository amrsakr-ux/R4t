"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw } from "lucide-react";

interface ScoringWeights {
  cv_quality: number;
  skills: number;
  experience: number;
  assessment: number;
}

export function SystemSettings() {
  const { toast } = useToast();
  const [weights, setWeights] = useState<ScoringWeights>({
    cv_quality: 20,
    skills: 30,
    experience: 25,
    assessment: 25,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config")
      .then(r => r.json())
      .then(d => {
        const scoringConfig = d.data?.find((c: { key: string; value: unknown }) => c.key === "scoring_weights");
        if (scoringConfig?.value) setWeights(scoringConfig.value as ScoringWeights);
        setLoading(false);
      });
  }, []);

  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleSave = async () => {
    if (total !== 100) {
      toast({ title: "Weights must sum to 100", description: `Current sum: ${total}`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "scoring_weights", value: weights }),
      });
      if (res.ok) {
        toast({ title: "Settings saved successfully" });
      }
    } finally {
      setSaving(false);
    }
  };

  const SliderInput = ({ label, field, color }: { label: string; field: keyof ScoringWeights; color: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <span className={`text-lg font-bold ${color}`}>{weights[field]}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={weights[field]}
        onChange={(e) => setWeights({ ...weights, [field]: parseInt(e.target.value) })}
        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
      />
    </div>
  );

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Scoring Weights</CardTitle>
          <CardDescription>
            Configure how much each component contributes to the overall candidate score.
            All weights must sum to 100%.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SliderInput label="CV Quality" field="cv_quality" color="text-blue-600" />
          <SliderInput label="Skills Relevance" field="skills" color="text-green-600" />
          <SliderInput label="Experience" field="experience" color="text-yellow-600" />
          <SliderInput label="Assessment Responses" field="assessment" color="text-purple-600" />

          <div className={`flex items-center justify-between p-3 rounded-lg ${total === 100 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            <span className="text-sm font-medium">Total</span>
            <span className="text-xl font-bold">{total}% {total !== 100 && "(must be 100%)"}</span>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setWeights({ cv_quality: 20, skills: 30, experience: 25, assessment: 25 })}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Reset Defaults
            </Button>
            <Button onClick={handleSave} disabled={saving || total !== 100} className="flex-1">
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">AI Model</span>
            <span className="font-medium">Claude + OpenAI Embeddings</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Scoring Model Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Max CV Size</span>
            <span className="font-medium">10 MB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Supported Formats</span>
            <span className="font-medium">PDF, DOCX</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
