import { Video } from "lucide-react";

export function ClassesYTTRecorded() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#610981" }}>YTT Recorded</h1>
        <p className="text-muted-foreground text-sm mt-1">Yoga Teacher Training — recorded sessions</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border/60">
        <Video className="w-12 h-12 mb-4 text-[#610981]/30" />
        <p className="text-sm text-muted-foreground">YTT Recorded content coming soon</p>
      </div>
    </div>
  );
}
