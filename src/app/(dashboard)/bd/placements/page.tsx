import { Header } from "@/components/layout/header";
import { PlacementsView } from "@/components/bd/placements-view";

export default function PlacementsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Placements" description="Track and manage all candidate placements" />
      <div className="flex-1 overflow-auto p-6">
        <PlacementsView />
      </div>
    </div>
  );
}
