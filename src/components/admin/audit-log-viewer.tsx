"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: { fullName: string; email: string; role: string } | null;
}

const ACTION_COLORS: Record<string, string> = {
  status_changed: "bg-blue-100 text-blue-800",
  placement_created: "bg-green-100 text-green-800",
  data_exported: "bg-yellow-100 text-yellow-800",
  login: "bg-gray-100 text-gray-800",
};

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "50",
        ...(action && action !== "all" && { action }),
        ...(entityType && entityType !== "all" && { entityType }),
      });
      const res = await fetch(`/api/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, action, entityType]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex gap-3">
          <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="status_changed">Status Changed</SelectItem>
              <SelectItem value="placement_created">Placement Created</SelectItem>
              <SelectItem value="data_exported">Data Exported</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entityType} onValueChange={(v) => { setEntityType(v); setPage(1); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="candidate">Candidate</SelectItem>
              <SelectItem value="placement">Placement</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-500 flex items-center">{total} events</span>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No audit logs found</TableCell></TableRow>
            ) : logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                <TableCell>
                  {log.user ? (
                    <div>
                      <p className="text-sm font-medium">{log.user.fullName}</p>
                      <p className="text-xs text-gray-400">{log.user.role}</p>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">System</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"}`}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="text-xs font-medium capitalize">{log.entityType}</span>
                    <p className="text-xs text-gray-400 font-mono">{log.entityId.slice(0, 8)}...</p>
                  </div>
                </TableCell>
                <TableCell>
                  {log.metadata && (
                    <code className="text-xs bg-gray-50 px-2 py-1 rounded max-w-xs block overflow-hidden text-ellipsis">
                      {JSON.stringify(log.metadata).slice(0, 80)}
                    </code>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-gray-500">{total} total events</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm px-3 py-1">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
