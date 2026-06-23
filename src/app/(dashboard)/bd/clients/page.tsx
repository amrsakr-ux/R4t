import { Header } from "@/components/layout/header";
import { ClientManagement } from "@/components/admin/client-management";

export default function BDClientsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Clients" description="View and manage client companies" />
      <div className="flex-1 overflow-auto p-6">
        <ClientManagement />
      </div>
    </div>
  );
}
