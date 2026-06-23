import { Header } from "@/components/layout/header";
import { ClientManagement } from "@/components/admin/client-management";

export default function AdminClientsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Client Management" description="Manage client companies and contacts" />
      <div className="flex-1 overflow-auto p-6">
        <ClientManagement />
      </div>
    </div>
  );
}
