import { Radio } from "lucide-react";

export function ClassesLive() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#610981" }}>Live Classes</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage and monitor live yoga sessions</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border/60">
        <Radio className="w-12 h-12 mb-4 text-[#610981]/30" />
        <p className="text-sm text-muted-foreground">Live classes content coming soon</p>
      </div>
    </div>
  );
}
