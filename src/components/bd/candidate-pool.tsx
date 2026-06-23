"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, ChevronLeft, ChevronRight, Star, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface Candidate {
  id: string;
  status: string;
  preferredJobTracks: string[];
  careerInterests: string[];
  createdAt: string;
  user: { fullName: string; email: string };
  aiScores: { overallScore: number }[];
}

const QUALIFIED_STATUSES = ["scored", "shortlisted"];

export function BDCandidatePool() {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        ...(search && { search }),
        ...(minScore && { minScore }),
      });
      QUALIFIED_STATUSES.forEach((s) => params.append("status", s));

      const res = await fetch(`/api/candidates?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, minScore]);

  useEffect(() => {
    const t = setTimeout(fetchCandidates, 300);
    return () => clearTimeout(t);
  }, [fetchCandidates]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === candidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(candidates.map((c) => c.id)));
    }
  };

  const exportSelected = async (format: "csv" | "xlsx") => {
    try {
      const res = await fetch(`/api/candidates/export?format=${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `candidates-${Date.now()}.${format}`;
      a.click();
      toast({ title: "Export successful" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search candidates..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Input
            type="number"
            placeholder="Min score (0-100)"
            value={minScore}
            onChange={(e) => { setMinScore(e.target.value); setPage(1); }}
            className="w-40"
          />
          {selected.size > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportSelected("csv")}>
                <Download className="w-4 h-4 mr-1" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportSelected("xlsx")}>
                <Download className="w-4 h-4 mr-1" /> Excel
              </Button>
            </div>
          )}
        </div>
        {selected.size > 0 && (
          <p className="text-sm text-blue-600 mt-2">{selected.size} candidate(s) selected</p>
        )}
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">Loading...</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" checked={selected.size === candidates.length && candidates.length > 0} onChange={toggleAll} className="rounded" />
                  </TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>AI Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Preferred Tracks</TableHead>
                  <TableHead>Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((c) => {
                  const score = c.aiScores[0]?.overallScore;
                  return (
                    <TableRow key={c.id} className={selected.has(c.id) ? "bg-blue-50" : ""}>
                      <TableCell>
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded" />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{c.user.fullName}</p>
                        <p className="text-xs text-gray-500">{c.user.email}</p>
                      </TableCell>
                      <TableCell>
                        {score !== undefined ? (
                          <div className="flex items-center gap-1">
                            <Star className={`w-3.5 h-3.5 ${score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-red-500"}`} fill="currentColor" />
                            <span className={`font-semibold text-sm ${score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600"}`}>{score}</span>
                          </div>
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{c.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.preferredJobTracks.slice(0, 2).map((t) => (
                            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(c.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-gray-500">{total} qualified candidates</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="text-sm px-3 py-1">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
