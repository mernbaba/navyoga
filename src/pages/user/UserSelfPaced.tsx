import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Share2, Lock } from "lucide-react";
import {
  Play,
  Clock,
  BookOpen,
  CheckCircle2,
  Search,
  Filter,
  GraduationCap,
  TrendingUp,
  Award,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  listModules,
  listClasses,
  getMySelfPacedSubscription,
} from "../../api/selfPaced";
import type { SelfPacedClass, SelfPacedModule } from "../../api/types";

type ModuleCourse = SelfPacedModule & {
  classes: SelfPacedClass[];
  totalDurationMin: number;
};

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80";

export function UserSelfPaced() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
  const [modules, setModules] = useState<ModuleCourse[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

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
        setEnrolled(sub.enrolled);
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
      const matchesSearch =
        !q ||
        mod.title.toLowerCase().includes(q) ||
        mod.classes.some((c) => c.title.toLowerCase().includes(q));
      const matchesEnrolled = !showEnrolledOnly || enrolled;
      return matchesSearch && matchesEnrolled;
    });
  }, [modules, searchQuery, enrolled, showEnrolledOnly]);

  const enrolledCourses = enrolled ? modules : [];

  const handleCourseClick = (mod: ModuleCourse) => {
    if (!enrolled) {
      navigate("/user/payments");
      return;
    }
    navigate(`/user/self-paced-course/${mod.id}`);
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
        className="relative bg-gradient-to-br from-[#ff691d] via-[#610981] to-[#8b0fa8] text-white overflow-hidden"
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
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Available Courses</p>
                  <p className="text-2xl font-bold">{modules.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Enrolled</p>
                  <p className="text-2xl font-bold">{enrolledCourses.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Status</p>
                  <p className="text-2xl font-bold">
                    {enrolled ? "Active" : "Not Enrolled"}
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
            className="mb-6 rounded-2xl border-2 border-[#ff691d]/30 bg-gradient-to-r from-[#ff691d]/10 to-[#610981]/10 p-6 flex items-center gap-4"
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
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search courses…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-2 focus:border-[#ff691d]"
              />
            </div>

            <Button
              variant={showEnrolledOnly ? "default" : "outline"}
              onClick={() => setShowEnrolledOnly(!showEnrolledOnly)}
              className="h-12"
              style={showEnrolledOnly ? { backgroundColor: "#610981", color: "white" } : {}}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showEnrolledOnly ? "My Courses" : "All Courses"}
            </Button>
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
              const thumb = course.classes[0]?.thumbnailUrl || FALLBACK_THUMB;
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.4 }}
                >
                  <Card className="group cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 hover:border-[#ff691d]/50 bg-white/80 backdrop-blur-sm">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={thumb}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {enrolled ? (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-white/90 backdrop-blur-sm text-[#610981] border-[#610981]">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Enrolled
                          </Badge>
                        </div>
                      ) : (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-black/70 backdrop-blur-sm text-white border-0">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </Badge>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <Badge className="bg-white/90 text-[#610981] border-[#610981]/30">
                          {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
                        </Badge>
                        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3 text-gray-700" />
                          <span className="text-xs font-semibold">
                            {formatDuration(course.totalDurationMin)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg group-hover:text-[#ff691d] transition-colors">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm">
                        {lessonCount === 0
                          ? "No classes published yet."
                          : `Includes ${lessonCount} guided session${lessonCount === 1 ? "" : "s"}.`}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCourseClick(course)}
                          disabled={lessonCount === 0}
                          className={`flex-1 group/btn text-white ${
                            enrolled
                              ? "bg-[#610981] hover:bg-[#7a0a9f]"
                              : "bg-[#ff691d] hover:bg-[#ff7f3a]"
                          }`}
                        >
                          {enrolled ? (
                            <>
                              <Play className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                              Continue Learning
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                              Enroll Now
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => {
                            const url = `${window.location.origin}/user/self-paced-course/${course.id}`;
                            if (navigator.share) {
                              navigator.share({
                                title: course.title,
                                text: `Check out this course: ${course.title}`,
                                url,
                              });
                            } else {
                              navigator.clipboard.writeText(url);
                              toast.success("Link copied!");
                            }
                          }}
                          className={`px-3 text-white ${
                            enrolled
                              ? "bg-[#ff691d] hover:bg-[#ff7f3a]"
                              : "bg-[#610981] hover:bg-[#7a0a9f]"
                          }`}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
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
            <p className="text-gray-600 mb-6">
              {showEnrolledOnly && !enrolled
                ? "You haven't enrolled in self-paced yet."
                : "Try adjusting your search."}
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setShowEnrolledOnly(false);
              }}
              style={{ backgroundColor: "#ff691d", color: "white" }}
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
