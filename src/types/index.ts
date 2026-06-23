import type { UserRole, GraduationStatus, CandidateStatus, PlacementStatus, ParseStatus, QuestionCategory } from "@prisma/client";

export type { UserRole, GraduationStatus, CandidateStatus, PlacementStatus, ParseStatus, QuestionCategory };

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export interface ParsedCVData {
  skills: string[];
  experience: {
    title: string;
    company: string;
    duration: string;
    years: number;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    field: string;
  }[];
  certifications: string[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  totalYearsExperience: number;
  summary: string;
  languages: string[];
}

export interface ScoringWeights {
  cv_quality: number;
  skills: number;
  experience: number;
  assessment: number;
}

export interface ScoreBreakdown {
  cv_quality: { score: number; weight: number; reasoning: string };
  skills: { score: number; weight: number; reasoning: string };
  experience: { score: number; weight: number; reasoning: string };
  assessment: { score: number; weight: number; reasoning: string };
}

export interface CandidateWithDetails {
  id: string;
  userId: string;
  phone: string | null;
  educationLevel: string | null;
  graduationStatus: GraduationStatus | null;
  careerInterests: string[];
  preferredJobTracks: string[];
  status: CandidateStatus;
  notes: string | null;
  applicationLinkToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
  };
  aiScores: {
    id: string;
    overallScore: number;
    cvQualityScore: number;
    skillsRelevanceScore: number;
    experienceScore: number;
    assessmentScore: number;
    modelVersion: string;
    computedAt: Date;
    scoreBreakdown: unknown;
  }[];
  cvDocuments: {
    id: string;
    fileUrl: string;
    fileName: string | null;
    parsedData: unknown;
    parseStatus: ParseStatus;
    uploadedAt: Date;
  }[];
}

export interface DashboardStats {
  totalCandidates: number;
  qualifiedCandidates: number;
  shortlistedCandidates: number;
  placedCandidates: number;
  averageScore: number;
  recentActivity: {
    date: string;
    count: number;
  }[];
  statusDistribution: {
    status: string;
    count: number;
  }[];
  trackDistribution: {
    track: string;
    count: number;
  }[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CandidateFilters {
  search?: string;
  status?: CandidateStatus[];
  track?: string[];
  minScore?: number;
  maxScore?: number;
  graduationStatus?: GraduationStatus[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
