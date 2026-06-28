import type { ClassDifficulty, LiveClass } from "../api/types";

// Selection + status logic for a student's live classes. Shared by the
// "My Live Classes" page (UserClasses) and the dashboard "Upcoming Classes"
// widget (UserDashboard) so both surfaces always agree on which class is the
// active/next one for a batch — they read the SAME endpoint
// (`/api/live/my-classes`, all batches) and run this SAME logic.

export type DerivedStatus = "LIVE" | "SCHEDULED" | "COMPLETED" | "UNSCHEDULED";

export function deriveStatus(c: LiveClass): DerivedStatus {
  if (c.startedAt && !c.endedAt) return "LIVE";
  if (c.endedAt || c.recording) return "COMPLETED";
  if (c.scheduledAt) return "SCHEDULED";
  return "UNSCHEDULED";
}

// A scheduled class is still "upcoming or ongoing" if its scheduled window
// (start → start + duration) has not fully elapsed yet. A class scheduled
// 5-6pm is still surfaced at 5:30pm, but disappears once 6pm has passed —
// even if it was never explicitly marked as ended.
export function isUpcomingOrOngoing(c: LiveClass): boolean {
  if (!c.scheduledAt) return false;
  const start = new Date(c.scheduledAt).getTime();
  const end = start + c.duration * 60 * 1000;
  return Date.now() <= end;
}

// Sort by scheduled date ascending (soonest first); unscheduled classes last.
export function byScheduledAsc(a: LiveClass, b: LiveClass): number {
  const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
  const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
  return ta - tb;
}

// Which of two classes in the same batch is the one to surface: a LIVE class
// always wins; otherwise the one scheduled sooner.
function isMoreActive(candidate: LiveClass, current: LiveClass): boolean {
  const candLive = deriveStatus(candidate) === "LIVE";
  const currLive = deriveStatus(current) === "LIVE";
  if (candLive !== currLive) return candLive;
  return byScheduledAsc(candidate, current) < 0;
}

/**
 * From the full class list, pick the live/upcoming classes to surface: a class
 * is included if it is truly LIVE (started, not ended) or SCHEDULED and still
 * within its window. Only ONE class per batch is kept — the active one (LIVE
 * wins, otherwise the soonest scheduled). Classes without a batch are each
 * kept. Result is sorted soonest-first.
 */
export function selectUpcomingClasses(
  classes: LiveClass[],
  predicate: (c: LiveClass) => boolean = () => true,
): LiveClass[] {
  const live = classes.filter((c) => {
    if (!predicate(c)) return false;
    const s = deriveStatus(c);
    if (s === "LIVE") return true;
    return s === "SCHEDULED" && isUpcomingOrOngoing(c);
  });

  const byBatch = new Map<string, LiveClass>();
  const noBatch: LiveClass[] = [];
  for (const c of live) {
    if (!c.batch) {
      noBatch.push(c);
      continue;
    }
    const current = byBatch.get(c.batch.id);
    if (!current || isMoreActive(c, current)) {
      byBatch.set(c.batch.id, c);
    }
  }

  return [...byBatch.values(), ...noBatch].sort(byScheduledAsc);
}

export const DIFFICULTY_COLOR: Record<ClassDifficulty, string> = {
  EASY: "#10b981",
  MEDIUM: "#f59e0b",
  HARD: "#ef4444",
};

export const DIFFICULTY_GRADIENT: Record<ClassDifficulty, string> = {
  EASY: "from-green-500 to-teal-500",
  MEDIUM: "from-yellow-500 to-orange-500",
  HARD: "from-red-500 to-pink-500",
};
