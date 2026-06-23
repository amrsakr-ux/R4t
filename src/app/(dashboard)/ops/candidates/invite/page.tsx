"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, CheckCircle, Loader2, Send } from "lucide-react";
import Link from "next/link";

export default function InviteCandidatePage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ fullName: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inviteUrl: string; candidateId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInvite = async () => {
    if (!form.fullName || !form.email) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/candidates/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.data);
        toast({ title: "Invitation created!" });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (result?.inviteUrl) {
      navigator.clipboard.writeText(result.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Invite Candidate"
        description="Generate a personalized application link for a candidate"
        actions={
          <Link href="/ops/candidates">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Candidates
            </Button>
          </Link>
        }
      />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle>Generate Invitation Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!result ? (
                <>
                  <div>
                    <Label>Candidate Full Name *</Label>
                    <Input
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="e.g. John Smith"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email Address *</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="candidate@email.com"
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleInvite} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    {loading ? "Generating..." : "Generate Invite Link"}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-4">
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="font-semibold text-lg">Invitation Created!</p>
                      <p className="text-gray-500 text-sm mt-1">Share this link with {form.fullName}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-xs text-gray-500">Application Link</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-white border rounded p-2 overflow-hidden text-ellipsis whitespace-nowrap">
                        {result.inviteUrl}
                      </code>
                      <Button variant="outline" size="sm" onClick={copyLink}>
                        {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    This link is unique to {form.fullName}. Do not share with others.
                  </p>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => { setResult(null); setForm({ fullName: "", email: "" }); }}
                    >
                      Invite Another
                    </Button>
                    <Link href="/ops/candidates" className="flex-1">
                      <Button className="w-full">View All Candidates</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
