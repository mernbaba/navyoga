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
  GraduationCap,
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
import {
  listMyYTTLiveEnrollments,
  listYTTLiveClassesForStudent,
  type YTTLiveEnrollmentInfo,
  type YTTLiveStudentClass,
} from "../../api/yttLive";
import type { ClassDifficulty } from "../../api/types";
import { resolveMediaUrl } from "../../lib/media";

type ClassWithCourse = YTTLiveStudentClass & {
  courseTitle: string;
};

type DerivedStatus = "LIVE" | "SCHEDULED" | "COMPLETED" | "UNSCHEDULED";

function deriveStatus(c: YTTLiveStudentClass): DerivedStatus {
  if (c.startedAt && !c.endedAt) return "LIVE";
  if (c.endedAt) return "COMPLETED";
  if (c.scheduledAt) return "SCHEDULED";
  return "UNSCHEDULED";
}

const SCHEDULED_JOIN_WINDOW_MS = 60 * 60 * 1000; // 1 hour

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

function formatScheduledAt(iso: string | null): string {
  if (!iso) return "Unscheduled";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function daysRemaining(endDateIso: string): number {
  const ms = new Date(endDateIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function UserYTTLive() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"classes" | "recordings">("classes");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<YTTLiveEnrollmentInfo[]>([]);
  const [classes, setClasses] = useState<ClassWithCourse[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const mine = await listMyYTTLiveEnrollments("STUDENT");
        if (cancelled) return;
        setEnrollments(mine);

        const lists = await Promise.all(
          mine.map(async (enrollment) => {
            try {
              const list = await listYTTLiveClassesForStudent(enrollment.courseId, "STUDENT");
              return list.map((c) => ({ ...c, courseTitle: enrollment.course.title }));
            } catch {
              return [] as ClassWithCourse[];
            }
          }),
        );
        if (cancelled) return;
        setClasses(lists.flat());
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load YTT Live classes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const enrolled = enrollments.length > 0;

  const { upcomingClasses, recordingClasses } = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const matchesShared = (c: ClassWithCourse) => {
      const matchesSearch =
        !term ||
        c.title.toLowerCase().includes(term) ||
        c.courseTitle.toLowerCase().includes(term);
      const matchesDifficulty =
        filterDifficulty === "all" || c.difficulty === filterDifficulty;
      return matchesSearch && matchesDifficulty;
    };
    return {
      upcomingClasses: classes.filter((c) => {
        const s = deriveStatus(c);
        return (s === "LIVE" || s === "SCHEDULED") && matchesShared(c);
      }),
      recordingClasses: classes.filter((c) => {
        const s = deriveStatus(c);
        return s === "COMPLETED" && Boolean(c.recording) && matchesShared(c);
      }),
    };
  }, [classes, searchTerm, filterDifficulty]);

  const primaryEnrollment = enrollments[0] ?? null;
  const upcomingCount = upcomingClasses.length;
  const recordingCount = recordingClasses.length;
  const liveNowCount = useMemo(
    () => classes.filter((c) => deriveStatus(c) === "LIVE").length,
    [classes],
  );

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-linear-to-br from-gray-50 via-white to-purple-50/30">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#ff691d] via-[#610981] to-[#8b0fa8] p-8 text-white shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="w-8 h-8" />
                <h1 className="text-4xl font-bold">My YTT Live Classes</h1>
              </div>
              <p className="text-white/90 text-lg">
                Live yoga teacher training sessions and recordings from your enrolled cohorts
              </p>
            </div>
            <div className="md:text-right">
              {loading ? (
                <HeroPlanSkeleton />
              ) : primaryEnrollment ? (
                <HeroEnrollmentInfo
                  enrollment={primaryEnrollment}
                  extraCount={enrollments.length - 1}
                />
              ) : (
                <HeroNoEnrollment />
              )}
            </div>
          </div>
        </motion.div>

        {enrolled && !loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="My Cohorts"
              value={enrollments.length}
              icon={GraduationCap}
              accent="#610981"
            />
            <StatCard
              label="Live Now"
              value={liveNowCount}
              icon={Radio}
              accent="#ef4444"
              pulse={liveNowCount > 0}
            />
            <StatCard
              label="Upcoming"
              value={upcomingCount}
              icon={Calendar}
              accent="#ff691d"
            />
            <StatCard
              label="Recordings"
              value={recordingCount}
              icon={Play}
              accent="#10b981"
            />
          </div>
        )}

        {error && !loading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </CardContent>
          </Card>
        )}

        {!loading && !enrolled && !error && (
          <Card className="border-2 border-[#ff691d]/30 bg-linear-to-r from-[#ff691d]/10 to-[#610981]/10">
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
              <div className="p-3 rounded-xl bg-[#ff691d]/15 mb-4">
                <Lock className="w-7 h-7 text-[#ff691d]" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-1">
                You're not enrolled in any YTT Live cohort yet
              </h3>
              <p className="text-sm text-gray-600 max-w-md mb-5">
                Enroll in a YTT Live course from the plans page to access its live
                sessions and recordings.
              </p>
              <Link to="/user/subscriptions?tab=ytt">
                <Button className="bg-linear-to-r from-[#ff691d] to-[#ff8c4d] text-white hover:from-[#ff5500] hover:to-[#ff691d] shadow-lg font-semibold">
                  <Crown className="w-4 h-4 mr-2" />
                  View YTT Live Plans
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {enrolled && !loading && (
          <>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="relative flex-1 min-w-0">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5 z-10 pointer-events-none"
                      strokeWidth={2.25}
                    />
                    <Input
                      placeholder="Search classes or courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 border-gray-300 focus:border-purple-300"
                    />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                      <SelectTrigger className="w-40 h-11 border-gray-300 bg-white">
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
                  <TabsList className="bg-gray-100 h-11 p-1 mb-6">
                    <TabsTrigger
                      value="classes"
                      className="px-5 data-[state=active]:bg-white data-[state=active]:text-[#ff691d] data-[state=active]:shadow-sm"
                    >
                      <BookOpen className="w-4 h-4 mr-1.5" />
                      Classes ({upcomingClasses.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="recordings"
                      className="px-5 data-[state=active]:bg-white data-[state=active]:text-[#10b981] data-[state=active]:shadow-sm"
                    >
                      <Play className="w-4 h-4 mr-1.5" />
                      Recordings ({recordingClasses.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="classes">
                    <ClassesGrid
                      items={upcomingClasses}
                      emptyTitle="No upcoming classes"
                      emptyHint="Live and scheduled sessions from your enrolled cohorts will appear here."
                      EmptyIcon={BookOpen}
                    />
                  </TabsContent>

                  <TabsContent value="recordings">
                    <ClassesGrid
                      items={recordingClasses}
                      emptyTitle="No recordings available"
                      emptyHint="Past sessions with uploaded recordings will appear here."
                      EmptyIcon={Play}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}

        {loading && enrollments.length === 0 && <ClassesSkeleton />}
      </div>
    </div>
  );
}

function HeroEnrollmentInfo({
  enrollment,
  extraCount,
}: {
  enrollment: YTTLiveEnrollmentInfo;
  extraCount: number;
}) {
  const remaining = daysRemaining(enrollment.expiresAt);
  return (
    <div className="rounded-2xl bg-white shadow-lg px-5 py-4 min-w-65">
      <div className="flex items-center gap-2 text-[#610981] text-xs uppercase tracking-wide font-semibold mb-1 md:justify-end">
        <Crown className="w-4 h-4" />
        Active enrollment
      </div>
      <p className="text-2xl font-bold text-gray-900 truncate">{enrollment.course.title}</p>
      <p className="text-sm text-gray-600 mt-0.5">{enrollment.planName}</p>
      <div className="flex flex-wrap gap-2 mt-3 md:justify-end">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
          {remaining} day{remaining === 1 ? "" : "s"} left
        </span>
        {extraCount > 0 && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-[#ff691d]">
            +{extraCount} more cohort{extraCount === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </div>
  );
}

function HeroNoEnrollment() {
  return (
    <div className="rounded-2xl bg-white shadow-lg px-5 py-4 min-w-65 flex flex-col gap-3 md:items-end">
      <div className="flex items-center gap-2 text-gray-900">
        <Lock className="w-4 h-4" />
        <span className="font-semibold">Not enrolled</span>
      </div>
      <Link to="/user/subscriptions?tab=ytt">
        <Button className="bg-linear-to-r from-[#ff691d] to-[#ff8c4d] text-white hover:from-[#ff5500] hover:to-[#ff691d] shadow-lg font-semibold">
          <Crown className="w-4 h-4 mr-2" />
          Enroll
        </Button>
      </Link>
    </div>
  );
}

function HeroPlanSkeleton() {
  return (
    <div className="rounded-2xl bg-white shadow-lg px-5 py-4 min-w-65 space-y-2">
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
  items: ClassWithCourse[];
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

function ClassCard({ liveClass: c }: { liveClass: ClassWithCourse }) {
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
              <p className="text-sm text-muted-foreground truncate">
                {c.courseTitle}
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

function resolveAction(c: ClassWithCourse): Action {
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
      <Button disabled className="w-full" variant="outline">
        <Lock className="w-4 h-4 mr-2" />
        Recording not available
      </Button>
    );
  }
  return (
    <Button disabled className="w-full" variant="outline">
      Unavailable
    </Button>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  pulse,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
  pulse?: boolean;
}) {
  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              pulse ? "animate-pulse" : ""
            }`}
            style={{ backgroundColor: `${accent}15` }}
          >
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {label}
            </p>
            <p className="text-2xl font-bold" style={{ color: accent }}>
              {value}
            </p>
          </div>
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
