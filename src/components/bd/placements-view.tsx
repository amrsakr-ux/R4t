"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Download, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface Placement {
  id: string;
  jobTitle: string;
  projectName: string | null;
  placementDate: string;
  placementStatus: string;
  candidate: { user: { fullName: string; email: string } };
  client: { name: string };
  jobOpportunity: { title: string; jobTrack: string } | null;
}

export function PlacementsView() {
  const { toast } = useToast();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchPlacements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: "20", ...(search && { search }) });
      const res = await fetch(`/api/placements?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPlacements(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchPlacements, 300);
    return () => clearTimeout(t);
  }, [fetchPlacements]);

  const handleExport = async () => {
    try {
      const res = await fetch("/api/placements/export?format=csv");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `placements-${Date.now()}.csv`;
      a.click();
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const statusColor: Record<string, string> = {
    confirmed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    fell_through: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search placements..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Placement
          </Button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">Loading...</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Placement Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placements.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">No placements found</TableCell></TableRow>
                ) : placements.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">{p.candidate.user.fullName}</p>
                      <p className="text-xs text-gray-500">{p.candidate.user.email}</p>
                    </TableCell>
                    <TableCell>{p.jobTitle}</TableCell>
                    <TableCell>{p.client.name}</TableCell>
                    <TableCell className="text-sm text-gray-500">{p.jobOpportunity?.jobTrack || "—"}</TableCell>
                    <TableCell className="text-sm">{formatDate(p.placementDate)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[p.placementStatus] || "bg-gray-100 text-gray-800"}`}>
                        {p.placementStatus.replace("_", " ")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-gray-500">{total} placements</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="text-sm px-3 py-1">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <CreatePlacementDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchPlacements} />
    </div>
  );
}

function CreatePlacementDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    candidateId: "",
    clientId: "",
    jobTitle: "",
    placementDate: new Date().toISOString().split("T")[0],
    placementStatus: "pending",
    projectName: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetch("/api/admin/clients").then(r => r.json()).then(d => setClients(d.data || []));
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!form.candidateId || !form.clientId || !form.jobTitle) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: "Placement created" });
        onCreated();
        onClose();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Placement</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Candidate ID *</Label>
            <Input value={form.candidateId} onChange={(e) => setForm({ ...form, candidateId: e.target.value })} placeholder="Candidate UUID" />
          </div>
          <div>
            <Label>Client *</Label>
            <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Job Title *</Label>
            <Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
          </div>
          <div>
            <Label>Placement Date</Label>
            <Input type="date" value={form.placementDate} onChange={(e) => setForm({ ...form, placementDate: e.target.value })} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.placementStatus} onValueChange={(v) => setForm({ ...form, placementStatus: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="fell_through">Fell Through</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Creating..." : "Create Placement"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
