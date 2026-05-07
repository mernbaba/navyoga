import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  GraduationCap,
  Calendar,
  Clock,
  Lock,
  Video,
  CheckCircle2,
  CalendarClock,
  PlayCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  listYTTLiveCoursesForStudent,
  listMyYTTLiveEnrollments,
  listYTTLiveClassesForStudent,
  type YTTLiveEnrollmentInfo,
  type YTTLiveStudentClass,
} from "../../api/yttLive";
import type { YTTCourse } from "../../api/types";

type CourseRow = YTTCourse & {
  enrollment: YTTLiveEnrollmentInfo | null;
};

const formatDate = (iso: string | null) => {
  if (!iso) return "TBD";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatExpiry = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const statusColor = (status: string) => {
  switch (status) {
    case "LIVE":
      return "bg-red-500 text-white";
    case "SCHEDULED":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "COMPLETED":
      return "bg-gray-100 text-gray-700 border border-gray-200";
    case "CANCELLED":
      return "bg-red-100 text-red-700 border border-red-200";
    default:
      return "bg-amber-100 text-amber-700 border border-amber-200";
  }
};

export function UserYTTLive() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [enrollments, setEnrollments] = useState<YTTLiveEnrollmentInfo[]>([]);
  const [classesByCourse, setClassesByCourse] = useState<Record<string, YTTLiveStudentClass[]>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [allCourses, mine] = await Promise.all([
          listYTTLiveCoursesForStudent("STUDENT"),
          listMyYTTLiveEnrollments("STUDENT"),
        ]);
        if (cancelled) return;

        const enrollmentByCourse = new Map(mine.map((e) => [e.courseId, e]));
        const rows: CourseRow[] = allCourses.map((c) => ({
          ...c,
          enrollment: enrollmentByCourse.get(c.id) ?? null,
        }));
        setCourses(rows);
        setEnrollments(mine);

        // Pre-fetch classes for enrolled courses so the upcoming sessions
        // panel renders without an extra round-trip.
        const classMap: Record<string, YTTLiveStudentClass[]> = {};
        await Promise.all(
          mine.map(async (enrollment) => {
            try {
              const list = await listYTTLiveClassesForStudent(enrollment.courseId, "STUDENT");
              classMap[enrollment.courseId] = list;
            } catch {
              classMap[enrollment.courseId] = [];
            }
          }),
        );
        if (!cancelled) setClassesByCourse(classMap);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load YTT Live courses.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcomingByCourse = useMemo(() => {
    const map: Record<string, YTTLiveStudentClass[]> = {};
    const now = Date.now();
    for (const [courseId, list] of Object.entries(classesByCourse)) {
      map[courseId] = list
        .filter((c) => {
          if (c.status === "CANCELLED" || c.status === "COMPLETED") return false;
          if (!c.scheduledAt) return true;
          return new Date(c.scheduledAt).getTime() >= now - 60 * 60 * 1000;
        })
        .slice(0, 3);
    }
    return map;
  }, [classesByCourse]);

  return (
    <div className="min-h-screen pb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-gradient-to-br from-[#ff691d] via-[#610981] to-[#8b0fa8] text-white overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ffac96]/20 rounded-full blur-3xl" />
        <div className="relative px-6 py-12 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">YTT Live</h1>
              <p className="text-white/90 mt-1">
                Live yoga teacher training cohorts with expert mentors
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
              <p className="text-sm text-white/80">Courses Available</p>
              <p className="text-2xl font-bold mt-1">{courses.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
              <p className="text-sm text-white/80">My Enrollments</p>
              <p className="text-2xl font-bold mt-1">{enrollments.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
              <p className="text-sm text-white/80">Upcoming Sessions</p>
              <p className="text-2xl font-bold mt-1">
                {Object.values(upcomingByCourse).reduce((acc, l) => acc + l.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="px-6 lg:px-8 mt-8 space-y-10">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            Loading…
          </div>
        ) : (
          <>
            {enrollments.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold" style={{ color: "#610981" }}>
                    My Cohorts
                  </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {enrollments.map((enrollment) => {
                    const upcoming = upcomingByCourse[enrollment.courseId] ?? [];
                    return (
                      <motion.div
                        key={enrollment.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                      >
                        <Card className="overflow-hidden border-2 border-[#610981]/20 bg-white/85 backdrop-blur-sm">
                          <CardHeader className="bg-gradient-to-r from-[#ff691d]/10 to-[#610981]/10 border-b">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <CardTitle className="text-xl truncate">
                                  {enrollment.course.title}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {enrollment.planName} • Active until {formatExpiry(enrollment.expiresAt)}
                                </CardDescription>
                              </div>
                              <Badge className="bg-[#610981] text-white">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Enrolled
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-gray-700">
                                Upcoming sessions
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {upcoming.length} scheduled
                              </Badge>
                            </div>

                            {upcoming.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-3">
                                No upcoming sessions scheduled yet.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {upcoming.map((cls) => {
                                  const liveNow = cls.status === "LIVE";
                                  const joinable = liveNow && Boolean(cls.link);
                                  return (
                                    <div
                                      key={cls.id}
                                      className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                      <div className="p-2 rounded-lg bg-white shrink-0">
                                        {liveNow ? (
                                          <PlayCircle className="w-4 h-4 text-red-500" />
                                        ) : (
                                          <CalendarClock className="w-4 h-4 text-[#610981]" />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate">{cls.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                          <Clock className="w-3 h-3" />
                                          <span>{formatDate(cls.scheduledAt)}</span>
                                          <span>•</span>
                                          <span>{cls.duration} min</span>
                                        </div>
                                      </div>
                                      <Badge className={`${statusColor(cls.status)} text-[10px]`}>
                                        {cls.status}
                                      </Badge>
                                      {joinable && cls.link && (
                                        <Button
                                          size="sm"
                                          className="bg-red-500 hover:bg-red-600 text-white"
                                          onClick={() => window.open(cls.link!, "_blank", "noopener")}
                                        >
                                          Join
                                        </Button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold" style={{ color: "#ff691d" }}>
                  Available Courses
                </h2>
              </div>

              {courses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center bg-white/40">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#ff691d]/10 mb-4">
                    <GraduationCap className="w-7 h-7" style={{ color: "#ff691d" }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No courses listed yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Check back soon for new YTT Live cohort launches.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course, idx) => {
                    const enrolled = course.enrollment !== null;
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * idx, duration: 0.35 }}
                      >
                        <Card className="overflow-hidden border-2 hover:border-[#ff691d]/50 transition-all hover:shadow-xl bg-white/85 backdrop-blur-sm h-full flex flex-col">
                          <div
                            className="h-44 bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${
                                course.thumbnailUrl ??
                                "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&q=80"
                              })`,
                            }}
                          >
                            <div className="h-full bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3 gap-2">
                              <Badge className="bg-white/90 text-[#610981] border border-[#610981]/30">
                                {course.yogaType}
                              </Badge>
                              <Badge className="bg-white/90 text-[#ff691d] border border-[#ff691d]/30">
                                {course.level.replace("_", " ")}
                              </Badge>
                              {enrolled ? (
                                <Badge className="ml-auto bg-[#610981] text-white">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Enrolled
                                </Badge>
                              ) : (
                                <Badge className="ml-auto bg-black/70 text-white border-0">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Locked
                                </Badge>
                              )}
                            </div>
                          </div>

                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{course.title}</CardTitle>
                            {course.description && (
                              <CardDescription className="line-clamp-2 text-sm">
                                {course.description}
                              </CardDescription>
                            )}
                          </CardHeader>

                          <CardContent className="flex-1 flex flex-col gap-3">
                            {enrolled && course.enrollment ? (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Active until {formatExpiry(course.enrollment.expiresAt)}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Video className="w-4 h-4" />
                                <span>Live mentor-led cohort</span>
                              </div>
                            )}

                            <div className="mt-auto pt-2">
                              <Button
                                className={`w-full text-white ${
                                  enrolled
                                    ? "bg-[#610981] hover:bg-[#7a0a9f]"
                                    : "bg-[#ff691d] hover:bg-[#ff7f3a]"
                                }`}
                                onClick={() =>
                                  enrolled
                                    ? toast.message("Sessions are listed under \"My Cohorts\" above.")
                                    : navigate("/user/payments")
                                }
                              >
                                {enrolled ? "View Schedule" : "Enroll Now"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
