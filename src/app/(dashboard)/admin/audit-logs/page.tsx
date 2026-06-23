import { Header } from "@/components/layout/header";
import { AuditLogViewer } from "@/components/admin/audit-log-viewer";

export default function AuditLogsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Audit Logs" description="Track all system activity and changes" />
      <div className="flex-1 overflow-auto p-6">
        <AuditLogViewer />
      </div>
    </div>
  );
}
