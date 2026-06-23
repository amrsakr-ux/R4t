import { PrismaClient, UserRole, GraduationStatus, CandidateStatus, PlacementStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // System config - scoring weights
  await prisma.systemConfig.upsert({
    where: { key: "scoring_weights" },
    update: {},
    create: {
      key: "scoring_weights",
      value: {
        cv_quality: 20,
        skills: 30,
        experience: 25,
        assessment: 25,
      },
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: "app_settings" },
    update: {},
    create: {
      key: "app_settings",
      value: {
        platform_name: "R4T Operations Platform",
        max_cv_size_mb: 10,
        supported_cv_formats: ["pdf", "docx"],
        ai_model_version: "1.0.0",
      },
    },
  });

  // Admin user
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@r4t.io" },
    update: {},
    create: {
      email: "admin@r4t.io",
      passwordHash: adminPassword,
      role: UserRole.system_admin,
      fullName: "System Administrator",
      isActive: true,
    },
  });

  // Ops admin user
  const opsAdminPassword = await bcrypt.hash("OpsAdmin@123", 12);
  const opsAdmin = await prisma.user.upsert({
    where: { email: "ops.admin@r4t.io" },
    update: {},
    create: {
      email: "ops.admin@r4t.io",
      passwordHash: opsAdminPassword,
      role: UserRole.ops_admin,
      fullName: "Operations Admin",
      isActive: true,
    },
  });

  // Ops staff user
  const opsStaffPassword = await bcrypt.hash("OpsStaff@123", 12);
  const opsStaff = await prisma.user.upsert({
    where: { email: "ops.staff@r4t.io" },
    update: {},
    create: {
      email: "ops.staff@r4t.io",
      passwordHash: opsStaffPassword,
      role: UserRole.ops_staff,
      fullName: "Operations Staff",
      isActive: true,
    },
  });

  // BD user
  const bdPassword = await bcrypt.hash("BD@123456", 12);
  const bdUser = await prisma.user.upsert({
    where: { email: "bd@r4t.io" },
    update: {},
    create: {
      email: "bd@r4t.io",
      passwordHash: bdPassword,
      role: UserRole.bd,
      fullName: "Business Development",
      isActive: true,
    },
  });

  // Assessment questions
  const questions = [
    { questionText: "What motivated you to pursue a career in your chosen field?", category: "motivation" as const, displayOrder: 1 },
    { questionText: "Where do you see yourself professionally in the next 3-5 years?", category: "goals" as const, displayOrder: 2 },
    { questionText: "Describe a significant challenge you faced in a previous role or academic project and how you overcame it.", category: "challenges" as const, displayOrder: 3 },
    { questionText: "What are your key technical skills and how have you applied them?", category: "skills" as const, displayOrder: 4 },
    { questionText: "Describe your most significant professional achievement or academic project.", category: "experience" as const, displayOrder: 5 },
    { questionText: "What type of work environment do you thrive in?", category: "preferences" as const, displayOrder: 6 },
    { questionText: "Why are you interested in working with our platform's clients?", category: "motivation" as const, displayOrder: 7 },
    { questionText: "What industries or job tracks are you most passionate about?", category: "preferences" as const, displayOrder: 8 },
  ];

  for (const q of questions) {
    await prisma.assessmentQuestion.upsert({
      where: {
        id: (await prisma.assessmentQuestion.findFirst({ where: { questionText: q.questionText } }))?.id || "non-existent",
      },
      update: {},
      create: {
        questionText: q.questionText,
        category: q.category,
        displayOrder: q.displayOrder,
        isActive: true,
      },
    });
  }

  // Clients
  const techCorp = await prisma.client.upsert({
    where: { id: "client-techcorp-001" },
    update: {},
    create: {
      id: "client-techcorp-001",
      name: "TechCorp Solutions",
      industry: "Technology",
      contactEmail: "hr@techcorp.com",
      contactName: "Sarah Johnson",
      isActive: true,
    },
  });

  const financeHub = await prisma.client.upsert({
    where: { id: "client-financehub-001" },
    update: {},
    create: {
      id: "client-financehub-001",
      name: "FinanceHub Group",
      industry: "Financial Services",
      contactEmail: "talent@financehub.com",
      contactName: "Ahmed Al-Rashid",
      isActive: true,
    },
  });

  const healthPlus = await prisma.client.upsert({
    where: { id: "client-healthplus-001" },
    update: {},
    create: {
      id: "client-healthplus-001",
      name: "HealthPlus Consulting",
      industry: "Healthcare",
      contactEmail: "careers@healthplus.com",
      contactName: "Dr. Maria Santos",
      isActive: true,
    },
  });

  // Job opportunities
  const jobs = [
    {
      id: "job-001",
      title: "Software Engineer",
      clientId: techCorp.id,
      requiredSkills: ["JavaScript", "TypeScript", "React", "Node.js"],
      requiredExperienceYears: 2,
      jobTrack: "Software Development",
      description: "Build and maintain web applications using modern JavaScript frameworks.",
      isActive: true,
    },
    {
      id: "job-002",
      title: "Data Analyst",
      clientId: financeHub.id,
      requiredSkills: ["Python", "SQL", "Excel", "Power BI", "Statistics"],
      requiredExperienceYears: 1,
      jobTrack: "Data & Analytics",
      description: "Analyze financial data and create insights for business decisions.",
      isActive: true,
    },
    {
      id: "job-003",
      title: "UX Designer",
      clientId: techCorp.id,
      requiredSkills: ["Figma", "User Research", "Prototyping", "UI Design"],
      requiredExperienceYears: 1,
      jobTrack: "Design",
      description: "Design user-centered experiences for web and mobile applications.",
      isActive: true,
    },
    {
      id: "job-004",
      title: "Business Analyst",
      clientId: healthPlus.id,
      requiredSkills: ["Requirements Analysis", "BPMN", "SQL", "Stakeholder Management"],
      requiredExperienceYears: 2,
      jobTrack: "Business Analysis",
      description: "Bridge business needs and technical solutions in healthcare projects.",
      isActive: true,
    },
    {
      id: "job-005",
      title: "DevOps Engineer",
      clientId: techCorp.id,
      requiredSkills: ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux"],
      requiredExperienceYears: 2,
      jobTrack: "Software Development",
      description: "Manage cloud infrastructure and deployment pipelines.",
      isActive: true,
    },
    {
      id: "job-006",
      title: "Financial Consultant",
      clientId: financeHub.id,
      requiredSkills: ["Financial Modeling", "Excel", "CFA", "Risk Analysis"],
      requiredExperienceYears: 3,
      jobTrack: "Finance & Consulting",
      description: "Provide strategic financial consulting to enterprise clients.",
      isActive: true,
    },
  ];

  for (const job of jobs) {
    await prisma.jobOpportunity.upsert({
      where: { id: job.id },
      update: {},
      create: job,
    });
  }

  // Sample candidates
  const candidatePassword = await bcrypt.hash("Candidate@123", 12);

  const candidate1User = await prisma.user.upsert({
    where: { email: "sara.ahmed@example.com" },
    update: {},
    create: {
      email: "sara.ahmed@example.com",
      passwordHash: candidatePassword,
      role: UserRole.candidate,
      fullName: "Sara Ahmed",
      isActive: true,
    },
  });

  const candidate1 = await prisma.candidate.upsert({
    where: { userId: candidate1User.id },
    update: {},
    create: {
      userId: candidate1User.id,
      phone: "+20 100 123 4567",
      educationLevel: "Bachelor's Degree",
      graduationStatus: GraduationStatus.graduated,
      careerInterests: ["Software Development", "Data Science"],
      preferredJobTracks: ["Software Development", "Data & Analytics"],
      status: CandidateStatus.scored,
      applicationLinkToken: "token-sara-ahmed-001",
    },
  });

  // AI Score for candidate 1
  await prisma.aiScore.upsert({
    where: { id: "score-sara-001" },
    update: {},
    create: {
      id: "score-sara-001",
      candidateId: candidate1.id,
      overallScore: 82,
      cvQualityScore: 85,
      skillsRelevanceScore: 80,
      experienceScore: 78,
      assessmentScore: 86,
      modelVersion: "1.0.0",
      scoringWeights: { cv_quality: 20, skills: 30, experience: 25, assessment: 25 },
    },
  });

  const candidate2User = await prisma.user.upsert({
    where: { email: "omar.hassan@example.com" },
    update: {},
    create: {
      email: "omar.hassan@example.com",
      passwordHash: candidatePassword,
      role: UserRole.candidate,
      fullName: "Omar Hassan",
      isActive: true,
    },
  });

  const candidate2 = await prisma.candidate.upsert({
    where: { userId: candidate2User.id },
    update: {},
    create: {
      userId: candidate2User.id,
      phone: "+20 101 234 5678",
      educationLevel: "Master's Degree",
      graduationStatus: GraduationStatus.graduated,
      careerInterests: ["Finance", "Consulting"],
      preferredJobTracks: ["Finance & Consulting", "Business Analysis"],
      status: CandidateStatus.shortlisted,
      applicationLinkToken: "token-omar-hassan-001",
    },
  });

  await prisma.aiScore.upsert({
    where: { id: "score-omar-001" },
    update: {},
    create: {
      id: "score-omar-001",
      candidateId: candidate2.id,
      overallScore: 91,
      cvQualityScore: 92,
      skillsRelevanceScore: 90,
      experienceScore: 94,
      assessmentScore: 88,
      modelVersion: "1.0.0",
      scoringWeights: { cv_quality: 20, skills: 30, experience: 25, assessment: 25 },
    },
  });

  const candidate3User = await prisma.user.upsert({
    where: { email: "nour.ibrahim@example.com" },
    update: {},
    create: {
      email: "nour.ibrahim@example.com",
      passwordHash: candidatePassword,
      role: UserRole.candidate,
      fullName: "Nour Ibrahim",
      isActive: true,
    },
  });

  const candidate3 = await prisma.candidate.upsert({
    where: { userId: candidate3User.id },
    update: {},
    create: {
      userId: candidate3User.id,
      phone: "+20 102 345 6789",
      educationLevel: "Bachelor's Degree",
      graduationStatus: GraduationStatus.graduated,
      careerInterests: ["UX Design", "Product Management"],
      preferredJobTracks: ["Design", "Business Analysis"],
      status: CandidateStatus.placed,
      applicationLinkToken: "token-nour-ibrahim-001",
    },
  });

  await prisma.aiScore.upsert({
    where: { id: "score-nour-001" },
    update: {},
    create: {
      id: "score-nour-001",
      candidateId: candidate3.id,
      overallScore: 76,
      cvQualityScore: 78,
      skillsRelevanceScore: 75,
      experienceScore: 70,
      assessmentScore: 82,
      modelVersion: "1.0.0",
      scoringWeights: { cv_quality: 20, skills: 30, experience: 25, assessment: 25 },
    },
  });

  // Placement for Nour
  await prisma.placement.upsert({
    where: { id: "placement-nour-001" },
    update: {},
    create: {
      id: "placement-nour-001",
      candidateId: candidate3.id,
      jobOpportunityId: "job-003",
      clientId: techCorp.id,
      projectName: "Digital Transformation Initiative",
      jobTitle: "UX Designer",
      placementDate: new Date("2024-11-01"),
      placementStatus: PlacementStatus.confirmed,
      createdBy: bdUser.id,
    },
  });

  console.log("✅ Seeding completed successfully!");
  console.log("\n📋 Test accounts:");
  console.log("  System Admin: admin@r4t.io / Admin@123456");
  console.log("  Ops Admin:    ops.admin@r4t.io / OpsAdmin@123");
  console.log("  Ops Staff:    ops.staff@r4t.io / OpsStaff@123");
  console.log("  BD:           bd@r4t.io / BD@123456");
  console.log("  Candidate:    sara.ahmed@example.com / Candidate@123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
