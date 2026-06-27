import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import {
  BookOpen,
  Search,
  Calendar,
  Clock,
  Radio,
  Lock,
  Play,
  Crown,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { motion } from "motion/react";
import { getMyLiveEnrollment, listMyLiveClasses } from "../../api/plans";
import { formatISTDateTime } from "../../lib/datetime";
import { resolveMediaUrl } from "../../lib/media";
import type {
  ClassDifficulty,
  LiveClass,
  MyLiveEnrollment,
} from "../../api/types";

type DerivedStatus = "LIVE" | "SCHEDULED" | "COMPLETED" | "UNSCHEDULED";

function deriveStatus(c: LiveClass): DerivedStatus {
  if (c.startedAt && !c.endedAt) return "LIVE";
  if (c.endedAt || c.recording) return "COMPLETED";
  if (c.scheduledAt) return "SCHEDULED";
  return "UNSCHEDULED";
}

// Sort by scheduled date ascending (soonest first); unscheduled classes last.
function byScheduledAsc(a: LiveClass, b: LiveClass): number {
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

const DIFFICULTY_COLOR: Record<ClassDifficulty, string> = {
  EASY: "#10b981",
  MEDIUM: "#f59e0b",
  HARD: "#ef4444",
};

const DIFFICULTY_GRADIENT: Record<ClassDifficulty, string> = {
  EASY: "from-green-500 to-teal-500",
  MEDIUM: "from-yellow-500 to-orange-500",
  HARD: "from-red-500 to-pink-500",
};

const SCHEDULED_JOIN_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Render in India time so every user sees the same IST wall-clock regardless
// of their device timezone.
function formatScheduledAt(iso: string | null): string {
  if (!iso) return "Unscheduled";
  return formatISTDateTime(iso, "Unscheduled") + " IST";
}

function daysRemaining(endDateIso: string): number {
  const ms = new Date(endDateIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function UserClasses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"classes" | "recordings">("classes");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<MyLiveEnrollment | null>(null);
  const [recordingDays, setRecordingDays] = useState(0);
  const [classes, setClasses] = useState<LiveClass[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getMyLiveEnrollment(), listMyLiveClasses()])
      .then(([enrollmentRes, classesRes]) => {
        if (cancelled) return;
        setEnrollment(enrollmentRes.enrollment);
        setRecordingDays(classesRes.recordingDays);
        setClasses(classesRes.classes);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load live classes";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { upcomingClasses, recordingClasses } = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const matchesShared = (c: LiveClass) => {
      const matchesSearch =
        !term ||
        c.title.toLowerCase().includes(term) ||
        (c.tutor?.name ?? "").toLowerCase().includes(term);
      const matchesDifficulty =
        filterDifficulty === "all" || c.difficulty === filterDifficulty;
      return matchesSearch && matchesDifficulty;
    };

    const live = classes.filter((c) => {
      const s = deriveStatus(c);
      return (s === "LIVE" || s === "SCHEDULED") && matchesShared(c);
    });

    // Show only one class per batch — the active one (LIVE wins, otherwise
    // the soonest upcoming scheduled class). Classes without a batch are
    // each kept on their own.
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

    const upcoming = [...byBatch.values(), ...noBatch].sort(byScheduledAsc);

    return {
      upcomingClasses: upcoming,
      recordingClasses: classes.filter((c) => {
        const s = deriveStatus(c);
        return s === "COMPLETED" && c.recording !== null && matchesShared(c);
      }),
    };
  }, [classes, searchTerm, filterDifficulty]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-linear-to-br from-gray-50 via-white to-purple-50/30">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#ff691d] via-[#ff8c4d] to-[#ffac96] p-6 sm:p-8 text-white shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">My Live Classes</h1>
              </div>
              <p className="text-white/90 text-base sm:text-lg">
                Join scheduled sessions and revisit recent recordings
              </p>
            </div>
            <div className="md:text-right">
              {loading ? (
                <HeroPlanSkeleton />
              ) : enrollment ? (
                <HeroPlanInfo enrollment={enrollment} recordingDays={recordingDays} />
              ) : (
                <HeroNoPlan />
              )}
            </div>
          </div>
        </motion.div>

        {error && !loading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </CardContent>
          </Card>
        )}

        {enrollment && !loading && (
          <>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5 z-10 pointer-events-none" strokeWidth={2.25} />
                    <Input
                      placeholder="Search classes or instructors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 border-gray-300 focus:border-purple-300"
                    />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                      <SelectTrigger className="w-full md:w-40 h-11 border-gray-300 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="EASY">Easy</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HARD">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-bl from-[#ff691d]/10 to-transparent rounded-full blur-3xl" />
              <CardContent className="relative z-10 pt-6">
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as "classes" | "recordings")}
                >
                  <TabsList className="bg-gray-100 h-11 p-1 mb-6 w-full sm:w-fit">
                    <TabsTrigger
                      value="classes"
                      className="flex-1 sm:flex-none px-3 sm:px-5 data-[state=active]:bg-white data-[state=active]:text-[#ff691d] data-[state=active]:shadow-sm"
                    >
                      <BookOpen className="w-4 h-4 mr-1.5" />
                      Classes ({upcomingClasses.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="recordings"
                      className="flex-1 sm:flex-none px-3 sm:px-5 data-[state=active]:bg-white data-[state=active]:text-[#10b981] data-[state=active]:shadow-sm"
                    >
                      <Play className="w-4 h-4 mr-1.5" />
                      Recordings ({recordingClasses.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="classes">
                    <ClassesGrid
                      items={upcomingClasses}
                      emptyTitle="No upcoming classes"
                      emptyHint="Live and scheduled sessions will appear here."
                      EmptyIcon={BookOpen}
                    />
                  </TabsContent>

                  <TabsContent value="recordings">
                    {recordingDays === 0 ? (
                      <div className="text-center py-16">
                        <Lock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-muted-foreground text-lg">
                          Your current plan does not include recordings.
                        </p>
                        <p className="text-muted-foreground text-sm mt-1">
                          Upgrade to access past sessions.
                        </p>
                      </div>
                    ) : (
                      <ClassesGrid
                        items={recordingClasses}
                        emptyTitle="No recordings available"
                        emptyHint={`Your plan grants access to recordings from the past ${recordingDays} day${recordingDays === 1 ? "" : "s"}.`}
                        EmptyIcon={Play}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}

        {loading && enrollment === null && <ClassesSkeleton />}
      </div>
    </div>
  );
}

function HeroPlanInfo({
  enrollment,
  recordingDays,
}: {
  enrollment: MyLiveEnrollment;
  recordingDays: number;
}) {
  const remaining = daysRemaining(enrollment.endDate);
  return (
    <div className="rounded-2xl bg-white shadow-lg px-5 py-4 w-full md:w-auto md:min-w-65">
      <div className="flex items-center gap-2 text-[#ff691d] text-xs uppercase tracking-wide font-semibold mb-1 md:justify-end">
        <Crown className="w-4 h-4" />
        Active plan
      </div>
      <p className="text-2xl font-bold text-gray-900">{enrollment.plan.name}</p>
      {enrollment.batch?.name && (
        <p className="text-sm text-gray-600 mt-0.5">Batch: {enrollment.batch.name}</p>
      )}
      <div className="flex flex-wrap gap-2 mt-3 md:justify-end">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
          {remaining} day{remaining === 1 ? "" : "s"} left
        </span>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-[#ff691d]">
          {recordingDays === 0
            ? "Live only"
            : `Recordings: past ${recordingDays}d`}
        </span>
      </div>
    </div>
  );
}

function HeroNoPlan() {
  return (
    <div className="rounded-2xl bg-white shadow-lg px-5 py-4 w-full md:w-auto md:min-w-65 flex flex-col gap-3 md:items-end">
      <div className="flex items-center gap-2 text-gray-900">
        <Lock className="w-4 h-4" />
        <span className="font-semibold">No active plan</span>
      </div>
      <Link to="/user/subscriptions?tab=live">
        <Button className="bg-linear-to-r from-[#ff691d] to-[#ff8c4d] text-white hover:from-[#ff5500] hover:to-[#ff691d] shadow-lg font-semibold">
          <Crown className="w-4 h-4 mr-2" />
          Subscribe
        </Button>
      </Link>
    </div>
  );
}

function HeroPlanSkeleton() {
  return (
    <div className="rounded-2xl bg-white shadow-lg px-5 py-4 w-full md:w-auto md:min-w-65 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-3 w-40" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    </div>
  );
}

function ClassesGrid({
  items,
  emptyTitle,
  emptyHint,
  EmptyIcon,
}: {
  items: LiveClass[];
  emptyTitle: string;
  emptyHint: string;
  EmptyIcon: React.ComponentType<{ className?: string }>;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <EmptyIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-muted-foreground text-lg">{emptyTitle}</p>
        <p className="text-muted-foreground text-sm mt-1">{emptyHint}</p>
      </div>
    );
  }
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {items.map((c, idx) => (
        <motion.div
          key={c.id}
          className="min-w-0"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.03 }}
        >
          <ClassCard liveClass={c} />
        </motion.div>
      ))}
    </div>
  );
}

function ClassCard({ liveClass: c }: { liveClass: LiveClass }) {
  const difficultyColor = DIFFICULTY_COLOR[c.difficulty];
  const difficultyGradient = DIFFICULTY_GRADIENT[c.difficulty];
  const action = resolveAction(c);

  return (
    <Card className="group border-2 border-gray-100 hover:border-purple-200 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden">
      <div className={`h-2 bg-linear-to-r ${difficultyGradient}`} />
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-1 truncate group-hover:text-purple-700 transition-colors">
                {c.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {c.tutor?.name ?? "TBA"}
                {c.batch?.name ? ` • ${c.batch.name}` : ""}
              </p>
            </div>
            <StatusBadge status={deriveStatus(c)} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              className="font-semibold"
              style={{ backgroundColor: `${difficultyColor}20`, color: difficultyColor }}
            >
              {c.difficulty}
            </Badge>
            <Badge variant="secondary" className="bg-gray-100">
              {c.yogaType}
            </Badge>
            <Badge variant="secondary" className="bg-gray-100">
              <Clock className="w-3 h-3 mr-1" />
              {c.duration} min
            </Badge>
          </div>

          <div className="p-4 rounded-xl bg-linear-to-br from-gray-50 to-white">
            <p className="text-xs text-muted-foreground font-medium">Scheduled</p>
            <p className="text-sm font-semibold text-gray-700">
              {formatScheduledAt(c.scheduledAt)}
            </p>
          </div>

          <ActionButton action={action} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: DerivedStatus }) {
  if (status === "LIVE") {
    return (
      <Badge className="bg-red-100 text-red-700 font-semibold animate-pulse">
        <Radio className="w-3 h-3 mr-1" />
        LIVE
      </Badge>
    );
  }
  if (status === "SCHEDULED") {
    return <Badge className="bg-purple-100 text-purple-700 font-semibold">Scheduled</Badge>;
  }
  if (status === "COMPLETED") {
    return <Badge className="bg-green-100 text-green-700 font-semibold">Completed</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

type Action =
  | { kind: "join"; classId: string }
  | { kind: "watch"; href: string }
  | { kind: "scheduled" }
  | { kind: "locked" }
  | { kind: "unavailable" };

function resolveAction(c: LiveClass): Action {
  const status = deriveStatus(c);
  if (status === "LIVE") return { kind: "join", classId: c.id };
  if (status === "SCHEDULED") {
    if (c.scheduledAt) {
      const ms = new Date(c.scheduledAt).getTime() - Date.now();
      if (ms <= SCHEDULED_JOIN_WINDOW_MS) return { kind: "join", classId: c.id };
    }
    return { kind: "scheduled" };
  }
  if (status === "COMPLETED") {
    const href = resolveMediaUrl(c.recording);
    if (href) return { kind: "watch", href };
    return { kind: "locked" };
  }
  return { kind: "unavailable" };
}

function ActionButton({ action }: { action: Action }) {
  if (action.kind === "join") {
    return (
      <Link to={`/user/class-session/${action.classId}`}>
        <Button className="w-full bg-linear-to-r from-[#ef4444] to-[#f97316] text-white shadow-lg">
          <Radio className="w-4 h-4 mr-2" />
          Join Live
        </Button>
      </Link>
    );
  }
  if (action.kind === "watch") {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer">
        <Button className="w-full bg-linear-to-r from-[#10b981] to-[#14b8a6] text-white shadow-lg">
          <Play className="w-4 h-4 mr-2" />
          Watch Recording
        </Button>
      </a>
    );
  }
  if (action.kind === "scheduled") {
    return (
      <Button disabled className="w-full" variant="outline">
        <Calendar className="w-4 h-4 mr-2" />
        Scheduled
      </Button>
    );
  }
  if (action.kind === "locked") {
    return (
      <div>
        <Button disabled className="w-full" variant="outline">
          <Lock className="w-4 h-4 mr-2" />
          Recording locked
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Upgrade plan to access older recordings
        </p>
      </div>
    );
  }
  return (
    <Button disabled className="w-full" variant="outline">
      Unavailable
    </Button>
  );
}

function PlanSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-6 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

function ClassesSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} className="border-2 border-gray-100">
          <Skeleton className="h-2 w-full" />
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
