import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Lock } from "lucide-react";
import {
  Play,
  Clock,
  BookOpen,
  Search,
  GraduationCap,
  TrendingUp,
  Crown,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  listModules,
  listClasses,
  getMySelfPacedSubscription,
  listMySelfPacedProgress,
  type MySelfPacedSubscription,
} from "../../api/selfPaced";
import type { SelfPacedClass, SelfPacedModule } from "../../api/types";

type ModuleCourse = SelfPacedModule & {
  classes: SelfPacedClass[];
  totalDurationMin: number;
};

export function UserSelfPaced() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [modules, setModules] = useState<ModuleCourse[]>([]);
  const [subscription, setSubscription] = useState<MySelfPacedSubscription["subscription"]>(null);
  const [completedClassIds, setCompletedClassIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const enrolled = subscription !== null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [mods, sub] = await Promise.all([
          listModules("STUDENT"),
          getMySelfPacedSubscription("STUDENT"),
        ]);
        const classesPerModule = await Promise.all(
          mods.map((m) => listClasses("STUDENT", m.id)),
        );
        if (cancelled) return;

        const courses: ModuleCourse[] = mods.map((m, i) => {
          const cls = classesPerModule[i].filter((c) => c.isActive);
          const totalDurationMin = cls.reduce((sum, c) => sum + (c.duration || 0), 0);
          return { ...m, classes: cls, totalDurationMin };
        });
        setModules(courses);
        setSubscription(sub.enrolled ? sub.subscription : null);

        if (sub.enrolled) {
          try {
            const progress = await listMySelfPacedProgress("STUDENT");
            if (cancelled) return;
            setCompletedClassIds(
              new Set(progress.filter((p) => p.isCompleted).map((p) => p.classId)),
            );
          } catch {
            // Progress is best-effort; don't fail the page if the endpoint is unavailable.
          }
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load self-paced courses.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return modules.filter((mod) => {
      return (
        !q ||
        mod.title.toLowerCase().includes(q) ||
        mod.classes.some((c) => c.title.toLowerCase().includes(q))
      );
    });
  }, [modules, searchQuery]);

  const totalClasses = useMemo(
    () => modules.reduce((sum, m) => sum + m.classes.length, 0),
    [modules],
  );

  const progressPct = useMemo(() => {
    if (!enrolled || totalClasses === 0) return 0;
    let completed = 0;
    for (const m of modules) {
      for (const c of m.classes) {
        if (completedClassIds.has(c.id)) completed += 1;
      }
    }
    return Math.round((completed / totalClasses) * 100);
  }, [modules, completedClassIds, totalClasses, enrolled]);

  // Sequential unlocking: a module is unlocked only if every preceding module
  // (in the catalogue order) is fully completed.
  const unlockedIds = useMemo(() => {
    const unlocked = new Set<string>();
    if (!enrolled) return unlocked;
    for (const m of modules) {
      unlocked.add(m.id);
      const completed =
        m.classes.length > 0 &&
        m.classes.every((c) => completedClassIds.has(c.id));
      if (!completed) break;
    }
    return unlocked;
  }, [modules, completedClassIds, enrolled]);

  const handleCourseClick = (mod: ModuleCourse) => {
    if (!enrolled) {
      navigate("/user/payments");
      return;
    }
    if (!unlockedIds.has(mod.id)) {
      toast.info("Complete the previous module to unlock this one.");
      return;
    }
    navigate(`/user/self-paced/${mod.id}`);
  };

  const formatDuration = (minutes: number) => {
    if (minutes <= 0) return "—";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };

  return (
    <div className="min-h-screen pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-linear-to-br from-[#ff691d] via-[#610981] to-[#8b0fa8] text-white overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ffac96]/20 rounded-full blur-3xl" />

        <div className="relative px-6 py-12 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Self-Paced Learning</h1>
              <p className="text-white/90 mt-1">Learn at your own pace, anytime, anywhere</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Modules</p>
                  <p className="text-2xl font-bold">{modules.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Classes</p>
                  <p className="text-2xl font-bold">{totalClasses}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Progress</p>
                  <p className="text-2xl font-bold">{progressPct}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Active Plan</p>
                  <p className="text-2xl font-bold truncate">
                    {subscription?.planName ?? "Not Enrolled"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="px-6 lg:px-8 mt-8">
        {!loading && !enrolled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border-2 border-[#ff691d]/30 bg-linear-to-r from-[#ff691d]/10 to-[#610981]/10 p-6 flex items-center gap-4"
          >
            <div className="p-3 rounded-xl bg-[#ff691d]/15">
              <Lock className="w-6 h-6 text-[#ff691d]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base text-gray-900">
                Subscribe to unlock self-paced classes
              </h3>
              <p className="text-sm text-gray-600">
                Browse the catalogue below and enroll to start watching at your own pace.
              </p>
            </div>
            <Button
              onClick={() => navigate("/user/payments")}
              style={{ backgroundColor: "#610981", color: "white" }}
            >
              View Plans
            </Button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 z-10 pointer-events-none" strokeWidth={2.25} />
            <Input
              placeholder="Search courses…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 border-2 focus:border-[#ff691d]"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            Loading…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {filteredCourses.map((course, index) => {
              const lessonCount = course.classes.length;
              const isCompleted =
                enrolled &&
                lessonCount > 0 &&
                course.classes.every((c) => completedClassIds.has(c.id));
              const isUnlocked = enrolled ? unlockedIds.has(course.id) : false;
              const showLock = !isUnlocked;
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.4 }}
                >
                  <Card
                    className={`group transition-all duration-300 overflow-hidden border-2 bg-white/80 backdrop-blur-sm flex flex-col ${
                      isUnlocked || !enrolled
                        ? "cursor-pointer hover:shadow-2xl hover:border-[#ff691d]/50"
                        : "opacity-75"
                    }`}
                  >
                    <div
                      className={`relative h-28 overflow-hidden bg-linear-to-br from-[#610981] via-[#8b0fa8] to-[#ff691d] ${
                        showLock && enrolled ? "grayscale" : ""
                      }`}
                    >
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/95 text-[#610981] border-0 font-semibold tracking-wide text-[10px]">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          MODULE
                        </Badge>
                      </div>
                      {isCompleted ? (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-green-500/95 text-white border-0 shadow-md">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                      ) : showLock ? (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-black/70 backdrop-blur-sm text-white border-0">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </Badge>
                        </div>
                      ) : null}
                      <div className="relative z-10 h-full flex items-center justify-center">
                        {showLock && enrolled ? (
                          <Lock className="w-9 h-9 text-white/80" />
                        ) : (
                          <BookOpen className="w-10 h-10 text-white/70" />
                        )}
                      </div>
                    </div>

                    <CardHeader className="pb-0 pt-3">
                      <CardTitle className="text-lg leading-tight group-hover:text-[#ff691d] transition-colors">
                        {course.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 justify-end space-y-3 pb-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <BookOpen className="w-4 h-4 text-[#610981]" />
                          <span className="font-semibold">{lessonCount}</span>
                          <span className="text-gray-500">
                            lesson{lessonCount === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="w-px h-4 bg-gray-200" />
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Clock className="w-4 h-4 text-[#ff691d]" />
                          <span className="font-semibold">
                            {formatDuration(course.totalDurationMin)}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleCourseClick(course)}
                        disabled={lessonCount === 0 || (enrolled && !isUnlocked)}
                        className={`w-full group/btn text-white ${
                          !enrolled
                            ? "bg-[#ff691d] hover:bg-[#ff7f3a]"
                            : isUnlocked
                              ? "bg-[#610981] hover:bg-[#7a0a9f]"
                              : "bg-gray-400 hover:bg-gray-400"
                        }`}
                      >
                        {!enrolled ? (
                          <>
                            <BookOpen className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                            Enroll Now
                          </>
                        ) : isUnlocked ? (
                          <>
                            <Play className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                            {isCompleted ? "Review" : "Continue Learning"}
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Locked
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && filteredCourses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search.</p>
            <Button
              onClick={() => setSearchQuery("")}
              style={{ backgroundColor: "#ff691d", color: "white" }}
            >
              Clear Search
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
