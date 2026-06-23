import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import type { ParsedCVData, ScoringWeights, ScoreBreakdown } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL_VERSION = "1.0.0";

async function getScoringWeights(): Promise<ScoringWeights> {
  const config = await prisma.systemConfig.findUnique({
    where: { key: "scoring_weights" },
  });

  if (config?.value) {
    return config.value as unknown as ScoringWeights;
  }

  return {
    cv_quality: parseInt(process.env.SCORING_WEIGHT_CV_QUALITY || "20"),
    skills: parseInt(process.env.SCORING_WEIGHT_SKILLS || "30"),
    experience: parseInt(process.env.SCORING_WEIGHT_EXPERIENCE || "25"),
    assessment: parseInt(process.env.SCORING_WEIGHT_ASSESSMENT || "25"),
  };
}

async function scoreWithClaude(
  parsedCV: ParsedCVData,
  assessmentResponses: { question: string; response: string }[],
  activeJobTracks: string[]
): Promise<{
  cvQuality: number;
  skills: number;
  experience: number;
  assessment: number;
  breakdown: ScoreBreakdown;
}> {
  const prompt = `You are an expert HR evaluator. Score this candidate on a scale of 0-100 for each dimension.

CANDIDATE CV DATA:
- Total Experience: ${parsedCV.totalYearsExperience} years
- Skills: ${parsedCV.skills.join(", ")}
- Education: ${parsedCV.education.map((e) => `${e.degree} in ${e.field} from ${e.institution}`).join("; ")}
- Work History: ${parsedCV.experience.map((e) => `${e.title} at ${e.company} (${e.duration})`).join("; ")}
- Certifications: ${parsedCV.certifications.join(", ") || "None"}
- Projects: ${parsedCV.projects.length} notable projects

ACTIVE JOB TRACKS (what clients need): ${activeJobTracks.join(", ")}

ASSESSMENT RESPONSES:
${assessmentResponses.map((r, i) => `Q${i + 1}: ${r.question}\nA: ${r.response}`).join("\n\n")}

Score each dimension and explain why (0-100):

1. CV QUALITY (completeness, clarity, professional formatting, detail richness)
2. SKILLS RELEVANCE (how well skills match active job tracks and market demand)
3. EXPERIENCE (years, relevance, progression, quality of past roles)
4. ASSESSMENT (motivation clarity, goal specificity, self-awareness, communication quality)

Return ONLY this JSON:
{
  "cvQuality": { "score": 75, "reasoning": "..." },
  "skills": { "score": 80, "reasoning": "..." },
  "experience": { "score": 70, "reasoning": "..." },
  "assessment": { "score": 85, "reasoning": "..." }
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in scoring response");

  const scores = JSON.parse(jsonMatch[0]);

  return {
    cvQuality: Math.min(100, Math.max(0, scores.cvQuality.score)),
    skills: Math.min(100, Math.max(0, scores.skills.score)),
    experience: Math.min(100, Math.max(0, scores.experience.score)),
    assessment: Math.min(100, Math.max(0, scores.assessment.score)),
    breakdown: {
      cv_quality: { score: scores.cvQuality.score, weight: 0, reasoning: scores.cvQuality.reasoning },
      skills: { score: scores.skills.score, weight: 0, reasoning: scores.skills.reasoning },
      experience: { score: scores.experience.score, weight: 0, reasoning: scores.experience.reasoning },
      assessment: { score: scores.assessment.score, weight: 0, reasoning: scores.assessment.reasoning },
    },
  };
}

export async function scoreCandidate(candidateId: string): Promise<void> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      cvDocuments: { where: { parseStatus: "parsed" }, orderBy: { uploadedAt: "desc" }, take: 1 },
      assessmentResponses: { include: { question: true } },
    },
  });

  if (!candidate) throw new Error("Candidate not found");

  const latestCV = candidate.cvDocuments[0];
  if (!latestCV?.parsedData) throw new Error("No parsed CV found for candidate");

  const parsedCV = latestCV.parsedData as unknown as ParsedCVData;
  const assessmentResponses = candidate.assessmentResponses.map((r) => ({
    question: r.question.questionText,
    response: r.responseText,
  }));

  const activeJobs = await prisma.jobOpportunity.findMany({
    where: { isActive: true },
    select: { jobTrack: true },
    distinct: ["jobTrack"],
  });
  const activeJobTracks = activeJobs.map((j) => j.jobTrack);

  const weights = await getScoringWeights();

  let scores;
  if (!process.env.ANTHROPIC_API_KEY || assessmentResponses.length === 0) {
    // Fallback rule-based scoring for testing
    const skillCount = parsedCV.skills.length;
    const expYears = parsedCV.totalYearsExperience;

    scores = {
      cvQuality: Math.min(100, 50 + skillCount * 2 + parsedCV.education.length * 5),
      skills: Math.min(100, 40 + skillCount * 3),
      experience: Math.min(100, 50 + expYears * 10),
      assessment: assessmentResponses.length > 0 ? 70 : 50,
      breakdown: {
        cv_quality: { score: 70, weight: weights.cv_quality, reasoning: "Rule-based fallback" },
        skills: { score: 70, weight: weights.skills, reasoning: "Rule-based fallback" },
        experience: { score: 70, weight: weights.experience, reasoning: "Rule-based fallback" },
        assessment: { score: 70, weight: weights.assessment, reasoning: "Rule-based fallback" },
      },
    };
  } else {
    scores = await scoreWithClaude(parsedCV, assessmentResponses, activeJobTracks);
  }

  // Update breakdown with actual weights
  scores.breakdown.cv_quality.weight = weights.cv_quality;
  scores.breakdown.skills.weight = weights.skills;
  scores.breakdown.experience.weight = weights.experience;
  scores.breakdown.assessment.weight = weights.assessment;

  const overallScore = Math.round(
    (scores.cvQuality * weights.cv_quality +
      scores.skills * weights.skills +
      scores.experience * weights.experience +
      scores.assessment * weights.assessment) /
      100
  );

  await prisma.aiScore.create({
    data: {
      candidateId,
      overallScore,
      cvQualityScore: scores.cvQuality,
      skillsRelevanceScore: scores.skills,
      experienceScore: scores.experience,
      assessmentScore: scores.assessment,
      modelVersion: MODEL_VERSION,
      scoringWeights: JSON.parse(JSON.stringify(weights)),
      scoreBreakdown: JSON.parse(JSON.stringify(scores.breakdown)),
    },
  });

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { status: "scored" },
  });
}
