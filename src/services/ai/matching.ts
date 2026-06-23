import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import type { ParsedCVData } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL_VERSION = "1.0.0";

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function ruleBasedMatch(
  parsedCV: ParsedCVData,
  jobSkills: string[],
  jobExperienceYears: number | null,
  candidateTrackPreferences: string[],
  jobTrack: string
): number {
  let score = 0;

  // Skill overlap (50% weight)
  if (jobSkills.length > 0) {
    const candidateSkillsLower = parsedCV.skills.map((s) => s.toLowerCase());
    const matchedSkills = jobSkills.filter((skill) =>
      candidateSkillsLower.some(
        (cs) => cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs)
      )
    );
    score += (matchedSkills.length / jobSkills.length) * 50;
  }

  // Experience years (30% weight)
  if (jobExperienceYears !== null) {
    const expRatio = Math.min(parsedCV.totalYearsExperience / jobExperienceYears, 1.2);
    score += Math.min(expRatio * 30, 30);
  } else {
    score += 20;
  }

  // Track preference match (20% weight)
  const trackMatch = candidateTrackPreferences.some(
    (pref) =>
      pref.toLowerCase().includes(jobTrack.toLowerCase()) ||
      jobTrack.toLowerCase().includes(pref.toLowerCase())
  );
  if (trackMatch) score += 20;

  return Math.min(100, Math.round(score));
}

export async function matchCandidateToJobs(candidateId: string): Promise<void> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      cvDocuments: { where: { parseStatus: "parsed" }, orderBy: { uploadedAt: "desc" }, take: 1 },
    },
  });

  if (!candidate) throw new Error("Candidate not found");

  const latestCV = candidate.cvDocuments[0];
  if (!latestCV?.parsedData) throw new Error("No parsed CV data");

  const parsedCV = latestCV.parsedData as unknown as ParsedCVData;

  const activeJobs = await prisma.jobOpportunity.findMany({
    where: { isActive: true },
  });

  if (activeJobs.length === 0) return;

  const matches: {
    candidateId: string;
    jobOpportunityId: string;
    matchPercentage: number;
    recommendedRank: number;
    matchReasons: string[];
    modelVersion: string;
  }[] = [];

  const useEmbeddings = !!process.env.OPENAI_API_KEY;

  const candidateText = [
    `Skills: ${parsedCV.skills.join(", ")}`,
    `Experience: ${parsedCV.totalYearsExperience} years`,
    `Track preferences: ${candidate.preferredJobTracks.join(", ")}`,
    `Career interests: ${candidate.careerInterests.join(", ")}`,
    parsedCV.summary,
  ]
    .filter(Boolean)
    .join(". ");

  let candidateEmbedding: number[] | null = null;
  if (useEmbeddings) {
    try {
      candidateEmbedding = await getEmbedding(candidateText);
    } catch {
      console.warn("Falling back to rule-based matching");
    }
  }

  for (const job of activeJobs) {
    let matchPercentage: number;
    const matchReasons: string[] = [];

    if (candidateEmbedding && useEmbeddings) {
      const jobText = [
        job.title,
        job.description || "",
        `Required skills: ${job.requiredSkills.join(", ")}`,
        `Track: ${job.jobTrack}`,
        `Experience required: ${job.requiredExperienceYears || 0} years`,
      ]
        .filter(Boolean)
        .join(". ");

      try {
        const jobEmbedding = await getEmbedding(jobText);
        const embeddingSimilarity = cosineSimilarity(candidateEmbedding, jobEmbedding);
        const ruleScore = ruleBasedMatch(
          parsedCV,
          job.requiredSkills,
          job.requiredExperienceYears,
          candidate.preferredJobTracks,
          job.jobTrack
        );
        // Blend: 60% embedding, 40% rules
        matchPercentage = Math.round(embeddingSimilarity * 100 * 0.6 + ruleScore * 0.4);
      } catch {
        matchPercentage = ruleBasedMatch(
          parsedCV,
          job.requiredSkills,
          job.requiredExperienceYears,
          candidate.preferredJobTracks,
          job.jobTrack
        );
      }
    } else {
      matchPercentage = ruleBasedMatch(
        parsedCV,
        job.requiredSkills,
        job.requiredExperienceYears,
        candidate.preferredJobTracks,
        job.jobTrack
      );
    }

    // Build match reasons
    const skillOverlap = job.requiredSkills.filter((skill) =>
      parsedCV.skills.map((s) => s.toLowerCase()).some((cs) => cs.includes(skill.toLowerCase()))
    );
    if (skillOverlap.length > 0) matchReasons.push(`Matching skills: ${skillOverlap.slice(0, 3).join(", ")}`);
    if (parsedCV.totalYearsExperience >= (job.requiredExperienceYears || 0)) {
      matchReasons.push(`${parsedCV.totalYearsExperience} years experience meets requirement`);
    }
    if (candidate.preferredJobTracks.some((t) => t.toLowerCase().includes(job.jobTrack.toLowerCase()))) {
      matchReasons.push(`Preferred track alignment: ${job.jobTrack}`);
    }

    matches.push({
      candidateId,
      jobOpportunityId: job.id,
      matchPercentage: Math.min(100, Math.max(0, matchPercentage)),
      recommendedRank: 0,
      matchReasons,
      modelVersion: MODEL_VERSION,
    });
  }

  // Sort and assign ranks
  matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
  matches.forEach((m, i) => (m.recommendedRank = i + 1));

  // Upsert all matches
  for (const match of matches) {
    await prisma.candidateJobMatch.upsert({
      where: { candidateId_jobOpportunityId: { candidateId, jobOpportunityId: match.jobOpportunityId } },
      update: {
        matchPercentage: match.matchPercentage,
        recommendedRank: match.recommendedRank,
        matchReasons: match.matchReasons,
        modelVersion: match.modelVersion,
      },
      create: match,
    });
  }
}
