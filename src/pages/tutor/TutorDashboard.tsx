import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Users, Calendar, Clock, TrendingUp, CheckCircle, Play, ClipboardCheck, Gift, ArrowRight, Award, GraduationCap, IndianRupee } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { getTutorDashboard } from "../../api/tutorDashboard";
import { getMyTutorUserReferrals, getMyTutorTutorReferrals } from "../../api/referrals";
import type { TutorDashboardStats } from "../../api/types";
import { getCachedUser } from "../../lib/session";
import { formatISTTime } from "../../lib/datetime";

type RecentReferral = {
  id: string;
  name: string | null;
  isTutor: boolean;
  reward: string | null;
  date: string;
};

function formatClassTime(scheduledAt: string | null, duration: number): string {
  if (!scheduledAt) return "-";
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + duration * 60 * 1000);
  return `${formatISTTime(start)} – ${formatISTTime(end)}`;
}

export function TutorDashboard() {
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [stats, setStats] = useState<TutorDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentReferrals, setRecentReferrals] = useState<RecentReferral[]>([]);

  const tutorName = getCachedUser("TUTOR")?.name ?? "Yoga Shikshak";

  useEffect(() => {
    getTutorDashboard("TUTOR")
      .then(setStats)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load dashboard.";
        toast.error(msg);
      })
      .finally(() => setIsLoading(false));

    Promise.all([
      getMyTutorUserReferrals("TUTOR", { limit: 3 }),
      getMyTutorTutorReferrals("TUTOR", { limit: 3 }),
    ]).then(([userRefs, tutorRefs]) => {
      const combined: RecentReferral[] = [
        ...userRefs.items.map((r) => ({ id: r.id, name: r.name, isTutor: false, reward: r.reward, date: r.date })),
        ...tutorRefs.items.map((r) => ({ id: r.id, name: r.name, isTutor: true, reward: r.reward, date: r.date })),
      ];
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentReferrals(combined.slice(0, 3));
    }).catch(() => {
      // referrals are non-critical; fail silently
    });
  }, []);

  // Legacy mesh path. The "Start (Old)" button that calls this is commented
  // out below; keep this handler so re-enabling is a one-line uncomment.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleStartClass = (classId: string, className?: string) => {
    if (className) setActiveSession(className);
    toast.success("Starting live session...");
    navigate(`/tutor/video-session?classId=${classId}`);
  };

  // SFU path — now the default for all Join/Start buttons.
  const handleStartClassSfu = (classId: string, className?: string) => {
    if (className) setActiveSession(className);
    toast.success("Starting live session...");
    navigate(`/tutor/video-session?classId=${classId}&mode=sfu`);
  };

  const handleEndClass = () => {
    setActiveSession(null);
    toast.success("Session ended successfully");
  };

  const statCards = [
    { name: "Total Sādhakas", value: isLoading ? "-" : (stats?.totalStudents ?? 0), icon: Users, color: "#ff691d", href: "/tutor/students" },
    { name: "Upcoming Classes", value: isLoading ? "-" : (stats?.upcomingClasses ?? 0), icon: Calendar, color: "#610981", href: "/tutor/classes" },
    { name: "Completed", value: isLoading ? "-" : (stats?.completedClasses ?? 0), icon: CheckCircle, color: "#10b981", href: "/tutor/attendance" },
    { name: "Avg. Attendance", value: isLoading ? "-" : `${stats?.avgAttendanceRate ?? 0}%`, icon: TrendingUp, color: "#3b82f6", href: "/tutor/attendance" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">

        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#610981] to-[#8b0fa8] p-6 sm:p-8 text-white shadow-2xl shadow-[#ffac96]/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff691d]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#ffac96]/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
<Badge variant="secondary" className="bg-white/20 text-white border-0">
                    Yoga Shikshak
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Welcome, {tutorName}! 👋</h1>
                <p className="text-white/80 text-base sm:text-lg">Ready to inspire your sādhakas today?</p>
              </div>
              {activeSession && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    <div>
                      <p className="text-sm font-medium">Active Session</p>
                      <p className="text-lg font-bold">{activeSession}</p>
                    </div>
                    <Button onClick={handleEndClass} variant="secondary" size="sm" className="ml-4">
                      End Class
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Link key={stat.name} to={stat.href}>
            <Card className="relative overflow-hidden group hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-[#ffac96]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: "#ffac96" }}>
                  {stat.name}
                </CardTitle>
                <div className="p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => navigate("/tutor/attendance")}
            className="group relative overflow-hidden rounded-2xl border-0 shadow-md hover:shadow-xl transition-all text-left p-6"
            style={{ background: "radial-gradient(circle at top right, #ff691d33 0%, #ff691d10 35%, #ffffff 75%)" }}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-[#ff691d] flex items-center justify-center shadow-lg shadow-[#ff691d]/30">
                <ClipboardCheck className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#ff691d] group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold mb-1" style={{ color: "#ff691d" }}>Teaching Activity</h3>
            <p className="text-sm text-muted-foreground mb-4">View your classes and performance</p>
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Classes This Month</span>
              <span className="text-lg font-bold" style={{ color: "#ff691d" }}>
                {isLoading ? "-" : (stats?.classesThisMonth ?? 0)}
              </span>
            </div>
          </button>

          <button
            onClick={() => navigate("/tutor/referrals")}
            className="group relative overflow-hidden rounded-2xl border-0 shadow-md hover:shadow-xl transition-all text-left p-6"
            style={{ background: "radial-gradient(circle at top right, #a855f733 0%, #a855f710 35%, #ffffff 75%)" }}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#a020c8] to-[#610981] flex items-center justify-center shadow-lg shadow-[#610981]/30">
                <Gift className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#610981] group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold mb-1" style={{ color: "#610981" }}>Referral Program</h3>
            <p className="text-sm text-muted-foreground mb-4">Refer students and tutors to earn rewards</p>
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">View your referrals</span>
              <span className="text-lg font-bold" style={{ color: "#610981" }}>→</span>
            </div>
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#610981]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: "#ff691d" }}>Today's Schedule</CardTitle>
              <CardDescription>Your classes for {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Loading schedule…</p>
              ) : (stats?.upcomingToday ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No classes scheduled for today.</p>
              ) : (
                (stats?.upcomingToday ?? []).map((cls) => (
                  <div
                    key={cls.id}
                    className="group relative flex items-center justify-between p-4 border border-border/50 rounded-xl hover:shadow-lg hover:shadow-[#ffac96]/20 transition-all duration-300 hover:border-[#ffac96]/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{cls.title}</h4>
                        {activeSession === cls.title ? (
                          <Badge className="bg-green-500">Live</Badge>
                        ) : (
                          <Badge variant="outline">upcoming</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {formatClassTime(cls.scheduledAt, cls.duration)}
                      </p>
                    </div>
                    {!activeSession && (
                      <div className="flex gap-2">
                        {/* Start (Old) — legacy mesh session, superseded by the SFU session below */}
                        {/* <Button
                          onClick={() => handleStartClass(cls.id, cls.title)}
                          className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start (Old)
                        </Button> */}
                        <Button
                          onClick={() => handleStartClassSfu(cls.id, cls.title)}
                          className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 bg-[#ff691d]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: "#ff691d" }}>Classes by Type</CardTitle>
              <CardDescription>Your assigned class types</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-62.5 items-center justify-center text-sm text-muted-foreground">Loading…</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats?.classBreakdown ?? []}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis key="xaxis" dataKey="name" stroke="#9ca3af" />
                    <YAxis key="yaxis" stroke="#9ca3af" />
                    <Tooltip
                      key="tooltip"
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #ffac96",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(255, 172, 150, 0.2)",
                      }}
                    />
                    <Bar key="bar" dataKey="count" fill="#610981" radius={[8, 8, 0, 0] as [number, number, number, number]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#ffac96]/5 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle style={{ color: "#ff691d" }}>Recent Referrals</CardTitle>
                <CardDescription>Your latest referral activity</CardDescription>
              </div>
              <button
                onClick={() => navigate("/tutor/referrals")}
                className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: "#610981" }}
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentReferrals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No referrals yet.</p>
              ) : (
                recentReferrals.map((ref) => (
                  <div
                    key={ref.id}
                    className="flex items-center justify-between p-3 border border-border/50 rounded-xl hover:shadow-md hover:border-[#ffac96]/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: ref.isTutor
                            ? "radial-gradient(circle at top right, #c9a8e0 0%, #ddc4ec 40%, #f0e4f7 100%)"
                            : "radial-gradient(circle at top right, #ffac9655 0%, #ffd8c2 40%, #fff0e6 100%)",
                        }}
                      >
                        {ref.isTutor ? (
                          <GraduationCap className="w-5 h-5" style={{ color: "#610981" }} strokeWidth={2.25} />
                        ) : (
                          <Users className="w-5 h-5" style={{ color: "#ff691d" }} strokeWidth={2.25} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{ref.name ?? "-"}</h4>
                        <p className="text-xs text-muted-foreground">
                          {ref.isTutor ? "Yoga Shikshak" : "Sādhaka"} • {new Date(ref.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {ref.reward != null && Number(ref.reward) > 0 && (
                      <Badge className="bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/15 border-0 flex items-center gap-0.5">
                        <span>+</span>
                        <IndianRupee className="w-3 h-3" />
                        <span>{Number(ref.reward).toLocaleString("en-IN")}</span>
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#ff691d]/5 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle style={{ color: "#ff691d" }}>This Month's Achievements</CardTitle>
                <CardDescription>Your teaching milestones</CardDescription>
              </div>
              <button
                onClick={() => navigate("/tutor/attendance")}
                className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: "#610981" }}
              >
                View Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#ff691d] to-[#ff8c4a] flex items-center justify-center shadow-md shadow-[#ff691d]/30 shrink-0">
                  <Award className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base mb-1.5">
                    {isLoading ? "-" : `${stats?.classesThisMonth ?? 0} Classes This Month`}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {isLoading ? "" : `${stats?.completedClasses ?? 0} completed total`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#a020c8] to-[#610981] flex items-center justify-center shadow-md shadow-[#610981]/30 shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base">
                    {isLoading ? "-" : `${stats?.teachingHoursThisMonth ?? 0} Teaching Hours`}
                  </h4>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#10b981] to-[#059669] flex items-center justify-center shadow-md shadow-[#10b981]/30 shrink-0">
                  <Users className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base">
                    {isLoading ? "-" : `${stats?.totalStudents ?? 0} Sādhakas`}
                  </h4>
                  <p className="text-xs text-muted-foreground">Across all classes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
