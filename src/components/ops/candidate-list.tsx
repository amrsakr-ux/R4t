"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Star } from "lucide-react";
import { getStatusColor, formatDate } from "@/lib/utils";
import type { CandidateStatus } from "@prisma/client";

interface Candidate {
  id: string;
  status: CandidateStatus;
  preferredJobTracks: string[];
  createdAt: string;
  user: { fullName: string; email: string };
  aiScores: { overallScore: number }[];
  cvDocuments: { parseStatus: string }[];
}

const STATUS_OPTIONS = ["invited", "registered", "assessed", "scored", "shortlisted", "placed", "rejected"];

export function CandidateListView() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        ...(search && { search }),
        ...(status && status !== "all" && { status }),
      });
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
  }, [page, search, status]);

  useEffect(() => {
    const timer = setTimeout(fetchCandidates, 300);
    return () => clearTimeout(timer);
  }, [fetchCandidates]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm text-gray-500 flex items-center">
            {total} candidate{total !== 1 ? "s" : ""}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">Loading candidates...</div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <p className="text-lg font-medium">No candidates found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI Score</TableHead>
                  <TableHead>Preferred Track</TableHead>
                  <TableHead>CV</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((c) => {
                  const score = c.aiScores[0]?.overallScore;
                  const cvStatus = c.cvDocuments[0]?.parseStatus;
                  return (
                    <TableRow key={c.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{c.user.fullName}</p>
                          <p className="text-xs text-gray-500">{c.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(c.status)}`}>
                          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {score !== undefined ? (
                          <div className="flex items-center gap-1">
                            <Star className={`w-3.5 h-3.5 ${score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-red-500"}`} fill="currentColor" />
                            <span className={`text-sm font-semibold ${score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                              {score}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Pending</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.preferredJobTracks.slice(0, 2).map((t) => (
                            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                          {c.preferredJobTracks.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{c.preferredJobTracks.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cvStatus ? (
                          <span className={`text-xs font-medium ${cvStatus === "parsed" ? "text-green-600" : cvStatus === "failed" ? "text-red-500" : "text-yellow-600"}`}>
                            {cvStatus.charAt(0).toUpperCase() + cvStatus.slice(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No CV</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(c.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/ops/candidates/${c.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
