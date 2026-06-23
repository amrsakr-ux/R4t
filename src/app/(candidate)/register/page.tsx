"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";

const JOB_TRACKS = ["Software Development", "Data & Analytics", "Design", "Business Analysis", "Finance & Consulting", "DevOps & Infrastructure", "Marketing", "Human Resources"];
const CAREER_INTERESTS = ["Technology", "Finance", "Healthcare", "Consulting", "Marketing", "Operations", "Product Management", "Research & Development"];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    token,
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    educationLevel: "",
    graduationStatus: "",
    careerInterests: [] as string[],
    preferredJobTracks: [] as string[],
  });

  const toggleArray = (key: "careerInterests" | "preferredJobTracks", value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (form.password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/candidates/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: form.token,
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          phone: form.phone,
          educationLevel: form.educationLevel,
          graduationStatus: form.graduationStatus || undefined,
          careerInterests: form.careerInterests,
          preferredJobTracks: form.preferredJobTracks,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: "Registration successful!" });
        await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });
        router.push(`/assessment?candidateId=${data.candidateId}`);
      } else {
        toast({ title: "Registration failed", description: data.error, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress */}
      <div className="flex items-center mb-8 gap-2">
        {[1, 2].map((s) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? "bg-blue-500" : "bg-white/20"}`} />
        ))}
      </div>

      <Card className="bg-white/10 backdrop-blur border-white/20">
        <CardHeader className="pb-0">
          <h2 className="text-2xl font-bold text-white">
            {step === 1 ? "Your Account" : "Career Preferences"}
          </h2>
          <p className="text-blue-200 text-sm">
            {step === 1 ? "Create your login credentials and basic info" : "Tell us about your career interests"}
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <Label className="text-blue-200">Full Name *</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Your full name" className="bg-white/10 border-white/20 text-white placeholder:text-blue-300" />
              </div>
              <div>
                <Label className="text-blue-200">Email Address *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" className="bg-white/10 border-white/20 text-white placeholder:text-blue-300" />
              </div>
              <div>
                <Label className="text-blue-200">Password *</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" className="bg-white/10 border-white/20 text-white" />
              </div>
              <div>
                <Label className="text-blue-200">Confirm Password *</Label>
                <Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              </div>
              <div>
                <Label className="text-blue-200">Phone Number</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+20 1XX XXXX XXX" className="bg-white/10 border-white/20 text-white placeholder:text-blue-300" />
              </div>
              <div>
                <Label className="text-blue-200">Education Level</Label>
                <Select value={form.educationLevel} onValueChange={(v) => setForm({ ...form, educationLevel: v })}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High School">High School</SelectItem>
                    <SelectItem value="Bachelor's Degree">Bachelor&apos;s Degree</SelectItem>
                    <SelectItem value="Master's Degree">Master&apos;s Degree</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                    <SelectItem value="Vocational / Diploma">Vocational / Diploma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-blue-200">Graduation Status</Label>
                <Select value={form.graduationStatus} onValueChange={(v) => setForm({ ...form, graduationStatus: v })}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="graduated">Graduated</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => {
                if (!form.fullName || !form.email || !form.password) {
                  toast({ title: "Please fill required fields", variant: "destructive" });
                  return;
                }
                setStep(2);
              }} className="w-full bg-blue-500 hover:bg-blue-600">
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Label className="text-blue-200 mb-2 block">Career Interests (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CAREER_INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleArray("careerInterests", interest)}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        form.careerInterests.includes(interest)
                          ? "bg-blue-500 text-white"
                          : "bg-white/10 text-blue-200 hover:bg-white/20"
                      }`}
                    >
                      {form.careerInterests.includes(interest) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-blue-200 mb-2 block">Preferred Job Tracks</Label>
                <div className="grid grid-cols-2 gap-2">
                  {JOB_TRACKS.map((track) => (
                    <button
                      key={track}
                      type="button"
                      onClick={() => toggleArray("preferredJobTracks", track)}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        form.preferredJobTracks.includes(track)
                          ? "bg-blue-500 text-white"
                          : "bg-white/10 text-blue-200 hover:bg-white/20"
                      }`}
                    >
                      {form.preferredJobTracks.includes(track) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                      {track}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-white/20 text-white hover:bg-white/10">Back</Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-blue-500 hover:bg-blue-600">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {loading ? "Registering..." : "Complete Registration"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
