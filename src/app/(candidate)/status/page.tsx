import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, Star, Briefcase, FileText, ClipboardList, User } from "lucide-react";

const statusInfo: Record<string, { title: string; desc: string; icon: React.ElementType; color: string }> = {
  invited: { title: "Invited", desc: "You have been invited to apply. Click your invitation link to start.", icon: User, color: "text-gray-400" },
  registered: { title: "Registration Complete", desc: "Your profile has been set up. Please complete the assessment.", icon: CheckCircle, color: "text-blue-400" },
  assessed: { title: "Assessment Submitted", desc: "Your assessment is under review. Our AI is analyzing your responses.", icon: ClipboardList, color: "text-purple-400" },
  scored: { title: "Profile Scored", desc: "Our AI has scored your profile and matched you to opportunities. The ops team is reviewing.", icon: Star, color: "text-indigo-400" },
  shortlisted: { title: "Shortlisted!", desc: "Great news! You have been shortlisted. A consultant will reach out soon.", icon: Star, color: "text-yellow-400" },
  placed: { title: "Placed!", desc: "Congratulations! You have been successfully placed. Welcome to your new role!", icon: Briefcase, color: "text-green-400" },
  rejected: { title: "Not Selected", desc: "Thank you for applying. Unfortunately, we don't have a suitable match at this time.", icon: Clock, color: "text-red-400" },
};

const statusSteps = ["registered", "assessed", "scored", "shortlisted", "placed"];

export default async function StatusPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "candidate") redirect("/ops");

  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.user.id },
    include: {
      aiScores: { orderBy: { computedAt: "desc" }, take: 1 },
      cvDocuments: { orderBy: { uploadedAt: "desc" }, take: 1, select: { parseStatus: true, fileName: true } },
    },
  });

  if (!candidate) redirect("/login");

  const info = statusInfo[candidate.status] || statusInfo.registered;
  const Icon = info.icon;
  const currentStepIndex = statusSteps.indexOf(candidate.status);

  return (
    <div className="max-w-lg mx-auto">
      {/* Main Status Card */}
      <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
        <CardContent className="pt-8 pb-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${info.color.includes("green") ? "bg-green-500/20" : info.color.includes("yellow") ? "bg-yellow-500/20" : info.color.includes("blue") ? "bg-blue-500/20" : info.color.includes("indigo") ? "bg-indigo-500/20" : info.color.includes("purple") ? "bg-purple-500/20" : "bg-gray-500/20"}`}>
            <Icon className={`w-10 h-10 ${info.color}`} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{info.title}</h2>
          <p className="text-blue-200">{info.desc}</p>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
        <CardContent className="pt-6 pb-6">
          <h3 className="text-white font-semibold mb-4">Your Application Journey</h3>
          <div className="space-y-3">
            {statusSteps.map((step, i) => {
              const completed = i <= currentStepIndex && candidate.status !== "rejected";
              const current = i === currentStepIndex;
              return (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    completed ? "bg-blue-500" : "bg-white/10"
                  }`}>
                    {completed ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-blue-400 text-sm font-medium">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${completed ? "text-white" : "text-blue-400"}`}>
                      {step.charAt(0).toUpperCase() + step.slice(1)}
                    </p>
                    {current && (
                      <p className="text-xs text-blue-300">Currently here</p>
                    )}
                  </div>
                  {current && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Profile Summary */}
      <Card className="bg-white/10 backdrop-blur border-white/20">
        <CardContent className="pt-6 pb-6 space-y-3">
          <h3 className="text-white font-semibold mb-4">Profile Summary</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-200 text-sm">
              <FileText className="w-4 h-4" />
              CV Upload
            </div>
            <span className={`text-xs font-medium ${
              candidate.cvDocuments[0]?.parseStatus === "parsed" ? "text-green-400" :
              candidate.cvDocuments[0]?.parseStatus === "pending" ? "text-yellow-400" :
              candidate.cvDocuments[0]?.parseStatus === "failed" ? "text-red-400" : "text-blue-400"
            }`}>
              {candidate.cvDocuments[0]?.parseStatus || "Not uploaded"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-200 text-sm">
              <ClipboardList className="w-4 h-4" />
              Assessment
            </div>
            <span className={`text-xs font-medium ${["assessed", "scored", "shortlisted", "placed"].includes(candidate.status) ? "text-green-400" : "text-blue-400"}`}>
              {["assessed", "scored", "shortlisted", "placed"].includes(candidate.status) ? "Completed" : "Pending"}
            </span>
          </div>

          {candidate.aiScores[0] && (
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-blue-200 text-sm">
                <Star className="w-4 h-4" />
                Profile Status
              </div>
              <span className="text-xs font-medium text-green-400">Under Review</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
