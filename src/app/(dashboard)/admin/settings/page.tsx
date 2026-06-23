import { Header } from "@/components/layout/header";
import { SystemSettings } from "@/components/admin/system-settings";

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="System Settings" description="Configure AI scoring weights and platform settings" />
      <div className="flex-1 overflow-auto p-6">
        <SystemSettings />
      </div>
    </div>
  );
}
