import { Video } from "lucide-react";

export function UserYTTRecorded() {
  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-semibold" style={{ color: "#ff691d" }}>YTT Recorded</h1>
        <p className="text-muted-foreground">Self-paced Yoga Teacher Training courses</p>
      </div>
      <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center bg-white/40">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#ff691d]/10 mb-4">
          <Video className="w-7 h-7" style={{ color: "#ff691d" }} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Coming soon</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Your enrolled recorded YTT courses and lessons will appear here.
        </p>
      </div>
    </div>
  );
}
