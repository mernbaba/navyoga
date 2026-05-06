import { BookOpen } from "lucide-react";

export function ClassesSelfPaced() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#610981" }}>Self Paced</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage self-paced yoga courses</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border/60">
        <BookOpen className="w-12 h-12 mb-4 text-[#610981]/30" />
        <p className="text-sm text-muted-foreground">Self paced content coming soon</p>
      </div>
    </div>
  );
}
