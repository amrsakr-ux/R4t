import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, FileText, ClipboardList, User } from "lucide-react";

export default async function ApplyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { applicationLinkToken: token },
    include: { user: { select: { fullName: true } } },
  });

  if (!candidate) notFound();

  if (candidate.status !== "invited") {
    return (
      <div className="max-w-md mx-auto text-center">
        <Card className="bg-white/10 backdrop-blur border-white/20">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Already Applied</h2>
            <p className="text-blue-200">Your application has already been submitted. Check your status below.</p>
            <Link href="/status">
              <Button className="mt-6 bg-white text-blue-900 hover:bg-blue-50">Check Status</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = [
    { icon: User, label: "Personal Information", desc: "Tell us about yourself" },
    { icon: ClipboardList, label: "Assessment", desc: "Answer a few career questions" },
    { icon: FileText, label: "Upload CV", desc: "Share your professional background" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/20 rounded-full mb-4">
          <User className="w-10 h-10 text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome, {candidate.user.fullName}!
        </h1>
        <p className="text-blue-200 text-lg">
          You&apos;ve been invited to apply through the R4T Operations Platform.
        </p>
        <p className="text-blue-300 text-sm mt-2">
          Complete your profile and assessment to be matched with the best opportunities.
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {steps.map((step, i) => (
          <Card key={i} className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <step.icon className="w-5 h-5 text-blue-300" />
              </div>
              <div className="text-blue-400 text-xs font-medium mb-1">Step {i + 1}</div>
              <h3 className="text-white font-semibold text-sm">{step.label}</h3>
              <p className="text-blue-300 text-xs mt-1">{step.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link href={`/register?token=${token}`}>
          <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg rounded-xl">
            Start Application <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
        <p className="text-blue-400 text-xs mt-4">
          Typically takes 15-20 minutes. Your progress is auto-saved.
        </p>
      </div>
    </div>
  );
}
