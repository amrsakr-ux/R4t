"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Briefcase, Users, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  jobTrack: string;
  requiredSkills: string[];
  requiredExperienceYears: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  client: { name: string } | null;
  _count: { jobMatches: number; placements: number };
}

export function JobTracksView() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    title: "",
    clientId: "",
    requiredSkills: "",
    requiredExperienceYears: "",
    jobTrack: "",
    description: "",
    isActive: true,
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs?pageSize=50");
      if (res.ok) setJobs((await res.json()).data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetch("/api/admin/clients").then(r => r.json()).then(d => setClients(d.data || []));
  }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          requiredSkills: form.requiredSkills.split(",").map(s => s.trim()).filter(Boolean),
          requiredExperienceYears: form.requiredExperienceYears ? parseInt(form.requiredExperienceYears) : undefined,
          clientId: form.clientId || undefined,
        }),
      });
      if (res.ok) {
        toast({ title: "Job opportunity created" });
        setShowCreate(false);
        fetchJobs();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleToggle = async (job: Job) => {
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !job.isActive }),
    });
    fetchJobs();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{jobs.filter(j => j.isActive).length} active opportunities</p>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Opportunity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center text-gray-500 py-8">Loading...</div>
        ) : jobs.map((job) => (
          <Card key={job.id} className={`${!job.isActive ? "opacity-60" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-500">{job.client?.name || "No client"}</p>
                </div>
                <Badge variant={job.isActive ? "default" : "secondary"} className="text-xs">
                  {job.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center gap-1 mb-3">
                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">{job.jobTrack}</span>
                {job.requiredExperienceYears && (
                  <span className="text-xs text-gray-400 ml-2">• {job.requiredExperienceYears}+ years</span>
                )}
              </div>

              {job.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {job.requiredSkills.slice(0, 4).map((s) => (
                    <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {job.requiredSkills.length > 4 && <span className="text-xs text-gray-400">+{job.requiredSkills.length - 4}</span>}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t">
                <div className="flex gap-3">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {job._count.jobMatches} matches</span>
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {job._count.placements} placements</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleToggle(job)}>
                  {job.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Job Opportunity</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div><Label>Job Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>Client</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select client (optional)" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Job Track *</Label><Input value={form.jobTrack} onChange={(e) => setForm({ ...form, jobTrack: e.target.value })} placeholder="e.g. Software Development" /></div>
            <div><Label>Required Skills (comma-separated)</Label><Input value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} placeholder="JavaScript, React, Node.js" /></div>
            <div><Label>Required Experience (years)</Label><Input type="number" value={form.requiredExperienceYears} onChange={(e) => setForm({ ...form, requiredExperienceYears: e.target.value })} min={0} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Opportunity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
