import { Header } from "@/components/layout/header";
import { UserManagement } from "@/components/admin/user-management";

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="User Management" description="Manage staff accounts and access roles" />
      <div className="flex-1 overflow-auto p-6">
        <UserManagement />
      </div>
    </div>
  );
}
