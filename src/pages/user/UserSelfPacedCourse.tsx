import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Circle,
  Lock,
  Clock,
  BookOpen,
  Share2,
  ChevronRight,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { motion } from "motion/react";
import { Progress } from "../../components/ui/progress";
import { toast } from "sonner";
import {
  getModule,
  listClasses,
  getMySelfPacedSubscription,
  listMySelfPacedProgress,
  upsertSelfPacedProgress,
} from "../../api/selfPaced";
import type { SelfPacedClass, SelfPacedModule } from "../../api/types";
import { resolveMediaUrl } from "../../lib/media";

const FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80";

const formatMinutes = (minutes: number) => {
  if (!minutes) return "0:00";
  const m = Math.floor(minutes);
  return `${m}:00`;
};

const formatTotalDuration = (minutes: number) => {
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
};

export function UserSelfPacedCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState<SelfPacedModule | null>(null);
  const [classes, setClasses] = useState<SelfPacedClass[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentClassId, setCurrentClassId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [showCurriculum, setShowCurriculum] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [mod, cls, sub] = await Promise.all([
          getModule("STUDENT", courseId),
          listClasses("STUDENT", courseId),
          getMySelfPacedSubscription("STUDENT"),
        ]);
        if (cancelled) return;
        const active = cls.filter((c) => c.isActive);
        setModule(mod);
        setClasses(active);
        setEnrolled(sub.enrolled);
        setCurrentClassId(active[0]?.id ?? null);

        if (sub.enrolled) {
          try {
            const progress = await listMySelfPacedProgress("STUDENT");
            if (cancelled) return;
            setCompletedIds(
              new Set(
                progress.filter((p) => p.isCompleted).map((p) => p.classId),
              ),
            );
          } catch {
            // Progress is best-effort; don't fail the page if the endpoint is unavailable.
          }
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "Failed to load this course.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const currentClass = useMemo(
    () => classes.find((c) => c.id === currentClassId) ?? null,
    [classes, currentClassId],
  );
  const currentIndex = useMemo(
    () =>
      currentClass ? classes.findIndex((c) => c.id === currentClass.id) : -1,
    [classes, currentClass],
  );
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < classes.length - 1;
  const totalDurationMin = classes.reduce(
    (sum, c) => sum + (c.duration || 0),
    0,
  );
  const completedCount = useMemo(
    () => classes.filter((c) => completedIds.has(c.id)).length,
    [classes, completedIds],
  );
  const progressPct =
    classes.length === 0
      ? 0
      : Math.round((completedCount / classes.length) * 100);

  const selectClass = (cls: SelfPacedClass) => {
    if (!enrolled) return;
    setCurrentClassId(cls.id);
  };

  const handleMarkComplete = async () => {
    if (!currentClass) return;
    const targetId = currentClass.id;
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.add(targetId);
      return next;
    });
    if (hasNext) {
      setCurrentClassId(classes[currentIndex + 1].id);
    }
    try {
      await upsertSelfPacedProgress(targetId, {
        isCompleted: true,
        progress: 100,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't save progress.",
      );
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white text-sm">
        Loading…
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <p>Course not found.</p>
        <Button variant="outline" onClick={() => navigate("/user/self-paced")}>
          Back to Courses
        </Button>
      </div>
    );
  }

  const showLockOverlay = !enrolled;

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-black/95 backdrop-blur-sm border-b border-white/10 sticky top-16 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/user/self-paced")}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
            <div className="hidden md:block">
              <h2 className="text-white font-semibold">{module.title}</h2>
              <p className="text-sm text-gray-400">
                {classes.length} lesson{classes.length === 1 ? "" : "s"} •{" "}
                {formatTotalDuration(totalDurationMin)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <BookOpen className="w-4 h-4 text-white" />
              <span className="text-sm text-white">
                {completedCount}/{classes.length} lessons
              </span>
              <span
                className={`text-sm font-semibold ${
                  progressPct === 100 ? "text-green-500" : "text-[#ff691d]"
                }`}
              >
                {progressPct}%
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setShowCurriculum(!showCurriculum)}
            >
              {showCurriculum ? "Hide" : "Show"} Curriculum
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        <div className={`flex-1 ${showCurriculum ? "lg:mr-96" : ""}`}>
          <div className="relative bg-black aspect-video">
            {currentClass && enrolled ? (
              <video
                key={currentClass.id}
                className="w-full h-full"
                src={resolveMediaUrl(currentClass.video)}
                poster={resolveMediaUrl(currentClass.thumbnail) ?? FALLBACK_POSTER}
                controls
              />
            ) : (
              <div
                className="w-full h-full bg-cover bg-center flex items-center justify-center"
                style={{
                  backgroundImage: `url(${resolveMediaUrl(currentClass?.thumbnail) ?? FALLBACK_POSTER})`,
                }}
              >
                <div className="absolute inset-0 bg-black/70" />
                <div className="relative z-10 text-center px-6">
                  {showLockOverlay ? (
                    <>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-semibold text-white mb-2">
                        Subscribe to start watching
                      </h2>
                      <p className="text-white/70 mb-6">
                        Enroll in a self-paced plan to unlock every lesson in
                        this course.
                      </p>
                      <Button
                        onClick={() => navigate("/user/subscriptions?tab=selfpaced")}
                        style={{ backgroundColor: "#ff691d", color: "white" }}
                      >
                        View Plans
                      </Button>
                    </>
                  ) : (
                    <p className="text-white/80">No lessons available yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-linear-to-br from-gray-900 to-black text-white p-6 lg:p-8">
            <div className="flex items-start justify-between mb-6 gap-4">
              <div className="flex-1 min-w-0">
                {showLockOverlay && (
                  <div className="mb-2">
                    <Badge className="bg-black/60 text-white border border-white/20">
                      <Lock className="w-3 h-3 mr-1" />
                      Locked
                    </Badge>
                  </div>
                )}
                <h1 className="text-2xl lg:text-3xl font-bold mb-2 wrap-break-word">
                  {currentClass
                    ? `${currentIndex + 1}. ${currentClass.title}`
                    : module.title}
                </h1>
                {currentClass && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 text-sm text-gray-400 leading-none">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{currentClass.duration} min</span>
                    </div>
                    {completedIds.has(currentClass.id) && (
                      <Badge className="bg-green-500 text-white inline-flex items-center gap-1 leading-none">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        Completed
                      </Badge>
                    )}
                  </div>
                )}
                {currentClass?.description && (
                  <p className="mt-3 text-gray-300 text-sm leading-relaxed max-w-2xl">
                    {currentClass.description}
                  </p>
                )}
              </div>
            </div>

            {enrolled && currentClass && (
              <div className="flex items-center gap-3 mb-6">
                <Button
                  disabled={!hasPrevious}
                  onClick={() => selectClass(classes[currentIndex - 1])}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  style={{ opacity: hasPrevious ? 1 : 0.5 }}
                >
                  <SkipBack className="w-4 h-4 mr-2" />
                  Previous Lesson
                </Button>

                {!completedIds.has(currentClass.id) && (
                  <Button
                    onClick={handleMarkComplete}
                    className="flex-1"
                    style={{ backgroundColor: "#610981", color: "white" }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Complete
                  </Button>
                )}

                <Button
                  disabled={!hasNext}
                  onClick={() => selectClass(classes[currentIndex + 1])}
                  className="flex-1"
                  style={{
                    backgroundColor: hasNext ? "#ff691d" : "#666",
                    color: "white",
                    opacity: hasNext ? 1 : 0.5,
                  }}
                >
                  Next Lesson
                  <SkipForward className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Your Progress</h3>
                <span
                  className="text-sm font-bold"
                  style={{ color: "#ff691d" }}
                >
                  {progressPct}% Complete
                </span>
              </div>
              <Progress value={progressPct} className="h-2 mb-3" />
              <p className="text-sm text-gray-400">
                {completedCount} of {classes.length} lessons completed
              </p>
            </div>
          </div>
        </div>

        {showCurriculum && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed right-0 top-[121px] bottom-0 w-96 bg-white border-l border-border overflow-hidden hidden lg:block"
          >
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="sticky top-0 bg-linear-to-br from-[#610981] to-[#8b0fa8] text-white p-6 z-10">
                <h2 className="text-lg font-bold mb-2 truncate">{module.title}</h2>
                <p className="text-sm text-white/80">
                  {classes.length} lesson{classes.length === 1 ? "" : "s"} •{" "}
                  {formatTotalDuration(totalDurationMin)}
                </p>
              </div>

              <div className="p-4">
                <Card className="overflow-hidden border-2">
                  <CardContent className="p-0">
                    {classes.length === 0 && (
                      <p className="text-sm text-muted-foreground p-4">
                        No lessons published yet.
                      </p>
                    )}
                    {classes.map((cls, lessonIndex) => {
                      const isCurrent = currentClass?.id === cls.id;
                      const isCompleted = completedIds.has(cls.id);
                      const isLocked = !enrolled;
                      return (
                        <button
                          key={cls.id}
                          onClick={() => selectClass(cls)}
                          disabled={isLocked}
                          className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-all ${
                            isCurrent
                              ? "bg-[#ff691d] text-white"
                              : isLocked
                                ? "bg-gray-50 cursor-not-allowed opacity-60"
                                : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-1">
                              {isLocked ? (
                                <Lock className="w-4 h-4 text-gray-400" />
                              ) : isCompleted ? (
                                <CheckCircle2
                                  className={`w-4 h-4 ${
                                    isCurrent ? "text-white" : "text-green-500"
                                  }`}
                                />
                              ) : isCurrent ? (
                                <Play className="w-4 h-4 fill-white text-white" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${
                                  isCurrent ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {lessonIndex + 1}. {cls.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock
                                  className={`w-3 h-3 ${
                                    isCurrent
                                      ? "text-white/80"
                                      : "text-gray-500"
                                  }`}
                                />
                                <span
                                  className={`text-xs ${
                                    isCurrent
                                      ? "text-white/80"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {formatMinutes(cls.duration)}
                                </span>
                              </div>
                            </div>
                            {isCurrent && (
                              <ChevronRight className="w-4 h-4 text-white shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
