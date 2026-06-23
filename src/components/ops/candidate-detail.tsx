"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { getStatusColor, formatDate, formatDateTime, capitalizeFirst } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { User, FileText, Star, Briefcase, MapPin, Phone, Mail, Award, BookOpen, Target, ChevronRight, Save } from "lucide-react";
import type { UserRole } from "@prisma/client";

interface ScoreBreakdown {
  cv_quality?: { score: number; reasoning: string };
  skills?: { score: number; reasoning: string };
  experience?: { score: number; reasoning: string };
  assessment?: { score: number; reasoning: string };
}

interface Candidate {
  id: string;
  status: string;
  phone: string | null;
  educationLevel: string | null;
  graduationStatus: string | null;
  careerInterests: string[];
  preferredJobTracks: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: { fullName: string; email: string };
  aiScores: {
    overallScore: number;
    cvQualityScore: number;
    skillsRelevanceScore: number;
    experienceScore: number;
    assessmentScore: number;
    computedAt: string;
    scoreBreakdown: ScoreBreakdown | null;
  }[];
  cvDocuments: {
    id: string;
    fileUrl: string;
    fileName: string | null;
    parsedData: {
      skills?: string[];
      experience?: { title: string; company: string; duration: string }[];
      education?: { degree: string; institution: string; year: string; field: string }[];
      certifications?: string[];
      totalYearsExperience?: number;
    } | null;
    parseStatus: string;
    uploadedAt: string;
  }[];
  assessmentResponses: {
    responseText: string;
    question: { questionText: string; category: string };
  }[];
  jobMatches: {
    matchPercentage: number;
    recommendedRank: number;
    matchReasons: string[];
    jobOpportunity: { id: string; title: string; jobTrack: string; requiredSkills: string[] };
  }[];
}

const CANDIDATE_STATUSES = ["invited", "registered", "assessed", "scored", "shortlisted", "placed", "rejected"];

export function CandidateDetailView({ candidate, currentUserRole }: { candidate: Candidate; currentUserRole: UserRole }) {
  const { toast } = useToast();
  const [status, setStatus] = useState(candidate.status);
  const [notes, setNotes] = useState(candidate.notes || "");
  const [saving, setSaving] = useState(false);

  const latestScore = candidate.aiScores[0];
  const latestCV = candidate.cvDocuments[0];
  const canEdit = ["ops_admin", "ops_staff", "system_admin"].includes(currentUserRole);

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/candidates/${candidate.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      if (res.ok) {
        setStatus(newStatus);
        toast({ title: "Status updated", description: `Candidate moved to ${newStatus}` });
      } else {
        toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await fetch(`/api/candidates/${candidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      toast({ title: "Notes saved" });
    } finally {
      setSaving(false);
    }
  };

  const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{value}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Profile & Controls */}
      <div className="space-y-4">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold">{candidate.user.fullName}</h2>
              <p className="text-gray-500 text-sm">{candidate.user.email}</p>
              <div className="mt-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(status as never)}`}>
                  {capitalizeFirst(status)}
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3 text-sm">
              {candidate.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{candidate.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{candidate.user.email}</span>
              </div>
              {candidate.educationLevel && (
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span>{candidate.educationLevel}</span>
                </div>
              )}
              {candidate.graduationStatus && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Award className="w-4 h-4" />
                  <span>{capitalizeFirst(candidate.graduationStatus)}</span>
                </div>
              )}
            </div>

            {candidate.preferredJobTracks.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Preferred Tracks</p>
                  <div className="flex flex-wrap gap-1">
                    {candidate.preferredJobTracks.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Status Management */}
        {canEdit && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Status Management</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANDIDATE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{capitalizeFirst(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {canEdit && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Internal Notes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this candidate..."
                rows={4}
                className="text-sm"
              />
              <Button size="sm" onClick={handleSaveNotes} disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-1" />
                Save Notes
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column - Details */}
      <div className="lg:col-span-2">
        <Tabs defaultValue="score">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="score">AI Score</TabsTrigger>
            <TabsTrigger value="cv">CV Data</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="matches">Job Matches</TabsTrigger>
          </TabsList>

          {/* AI Score Tab */}
          <TabsContent value="score">
            {latestScore ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>AI Score Breakdown</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`text-3xl font-bold ${latestScore.overallScore >= 80 ? "text-green-600" : latestScore.overallScore >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                        {latestScore.overallScore}
                      </div>
                      <div className="text-gray-400">/100</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Computed {formatDateTime(latestScore.computedAt)}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <ScoreBar label="CV Quality (20%)" value={latestScore.cvQualityScore} color="bg-blue-500" />
                    <ScoreBar label="Skills Relevance (30%)" value={latestScore.skillsRelevanceScore} color="bg-green-500" />
                    <ScoreBar label="Experience (25%)" value={latestScore.experienceScore} color="bg-yellow-500" />
                    <ScoreBar label="Assessment (25%)" value={latestScore.assessmentScore} color="bg-purple-500" />
                  </div>

                  {latestScore.scoreBreakdown && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Score Reasoning</h4>
                        <div className="space-y-3">
                          {Object.entries(latestScore.scoreBreakdown).map(([key, val]) => {
                            if (!val || typeof val !== "object") return null;
                            const breakdown = val as { score: number; reasoning: string };
                            return (
                              <div key={key} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium capitalize">{key.replace("_", " ")}</span>
                                  <Badge variant="outline">{breakdown.score}/100</Badge>
                                </div>
                                <p className="text-xs text-gray-600">{breakdown.reasoning}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-48 text-gray-500">
                  <div className="text-center">
                    <Star className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No AI score available yet</p>
                    <p className="text-sm">Score will be computed after CV is parsed</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* CV Data Tab */}
          <TabsContent value="cv">
            {latestCV ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Parsed CV Data</CardTitle>
                    <a href={latestCV.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-1" />
                        View Original
                      </Button>
                    </a>
                  </div>
                  <p className="text-xs text-gray-400">
                    Uploaded {formatDate(latestCV.uploadedAt)} • Status: {latestCV.parseStatus}
                  </p>
                </CardHeader>
                <CardContent>
                  {latestCV.parsedData ? (
                    <div className="space-y-6">
                      {/* Skills */}
                      {latestCV.parsedData.skills && latestCV.parsedData.skills.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><Target className="w-4 h-4" /> Skills</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {latestCV.parsedData.skills.map((s) => (
                              <Badge key={s} className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      {latestCV.parsedData.experience && latestCV.parsedData.experience.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <Briefcase className="w-4 h-4" /> Experience ({latestCV.parsedData.totalYearsExperience || 0} years)
                          </h4>
                          <div className="space-y-3">
                            {latestCV.parsedData.experience.map((exp, i) => (
                              <div key={i} className="border-l-2 border-blue-200 pl-3">
                                <p className="font-medium text-sm">{exp.title}</p>
                                <p className="text-gray-500 text-xs">{exp.company} • {exp.duration}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {latestCV.parsedData.education && latestCV.parsedData.education.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><BookOpen className="w-4 h-4" /> Education</h4>
                          <div className="space-y-2">
                            {latestCV.parsedData.education.map((edu, i) => (
                              <div key={i} className="bg-gray-50 rounded p-2">
                                <p className="text-sm font-medium">{edu.degree} in {edu.field}</p>
                                <p className="text-xs text-gray-500">{edu.institution} • {edu.year}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">CV is being parsed...</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-48 text-gray-500">
                  <div className="text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No CV uploaded yet</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Assessment Tab */}
          <TabsContent value="assessment">
            <Card>
              <CardHeader><CardTitle>Assessment Responses</CardTitle></CardHeader>
              <CardContent>
                {candidate.assessmentResponses.length > 0 ? (
                  <div className="space-y-5">
                    {candidate.assessmentResponses.map((r, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="text-xs mt-0.5">{r.question.category}</Badge>
                          <p className="text-sm font-medium text-gray-700">{r.question.questionText}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-3 ml-2">
                          <p className="text-sm text-gray-600">{r.responseText}</p>
                        </div>
                        {i < candidate.assessmentResponses.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>No assessment responses yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job Matches Tab */}
          <TabsContent value="matches">
            <Card>
              <CardHeader><CardTitle>Job Match Results</CardTitle></CardHeader>
              <CardContent>
                {candidate.jobMatches.length > 0 ? (
                  <div className="space-y-3">
                    {candidate.jobMatches.map((match) => (
                      <div key={match.jobOpportunity.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{match.jobOpportunity.title}</p>
                            <p className="text-xs text-gray-500">{match.jobOpportunity.jobTrack}</p>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${match.matchPercentage >= 70 ? "text-green-600" : match.matchPercentage >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                              {Math.round(match.matchPercentage)}%
                            </div>
                            <div className="text-xs text-gray-400">Match</div>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full ${match.matchPercentage >= 70 ? "bg-green-500" : match.matchPercentage >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${match.matchPercentage}%` }}
                          />
                        </div>
                        {match.matchReasons.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {match.matchReasons.map((r, i) => (
                              <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ChevronRight className="w-3 h-3" />
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No job matches computed yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
