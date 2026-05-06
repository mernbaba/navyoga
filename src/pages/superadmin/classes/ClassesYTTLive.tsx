import { GraduationCap } from "lucide-react";

export function ClassesYTTLive() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#610981" }}>YTT Live</h1>
        <p className="text-muted-foreground text-sm mt-1">Yoga Teacher Training — live sessions</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border/60">
        <GraduationCap className="w-12 h-12 mb-4 text-[#610981]/30" />
        <p className="text-sm text-muted-foreground">YTT Live content coming soon</p>
      </div>
    </div>
  );
}
