import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Award,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  BookOpen,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import {
  getMyTutorAttendanceToday,
  getMyTutorAttendanceHistory,
  markMyTutorAttendance,
} from "../../api/attendance";
import { getTutorDashboard } from "../../api/tutorDashboard";
import type { MyTutorAttendanceRecord, TutorDashboardStats, MyTutorAttendanceToday } from "../../api/types";

const ROLE = "TUTOR" as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatHours(h: number | string) {
  const n = Number(h);
  if (Number.isNaN(n)) return "0h";
  const hrs = Math.floor(n);
  const mins = Math.round((n - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function statusBadge(status: string) {
  if (status === "PRESENT")
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">Present</Badge>;
  if (status === "ABSENT")
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">Absent</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export function TutorAttendance() {
  const [dashboard, setDashboard] = useState<TutorDashboardStats | null>(null);
  const [todayRecord, setTodayRecord] = useState<MyTutorAttendanceToday>(null);
  const [history, setHistory] = useState<MyTutorAttendanceRecord[]>([]);
  const [historySummary, setHistorySummary] = useState({ total: 0, present: 0, absent: 0, attendanceRate: 0 });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => {
    setIsLoadingDashboard(true);
    Promise.all([
      getTutorDashboard(ROLE),
      getMyTutorAttendanceToday(ROLE),
    ])
      .then(([dash, today]) => {
        setDashboard(dash);
        setTodayRecord(today);
      })
      .catch(() => toast.error("Failed to load attendance data"))
      .finally(() => setIsLoadingDashboard(false));
  }, []);

  useEffect(() => {
    setIsLoadingHistory(true);
    getMyTutorAttendanceHistory(ROLE, { page: historyPage, limit: 10 })
      .then((res) => {
        setHistory(res.items);
        setHistorySummary(res.summary);
        setHistoryTotalPages(res.totalPages);
      })
      .catch(() => toast.error("Failed to load attendance history"))
      .finally(() => setIsLoadingHistory(false));
  }, [historyPage]);

  const handleMarkAttendance = async () => {
    setIsMarking(true);
    try {
      await markMyTutorAttendance(ROLE);
      const today = await getMyTutorAttendanceToday(ROLE);
      setTodayRecord(today);
      // Refresh history page 1
      const res = await getMyTutorAttendanceHistory(ROLE, { page: 1, limit: 10 });
      setHistory(res.items);
      setHistorySummary(res.summary);
      setHistoryTotalPages(res.totalPages);
      setHistoryPage(1);
      toast.success("Attendance marked for today");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark attendance");
    } finally {
      setIsMarking(false);
    }
  };

  const primaryStats = [
    {
      title: "Classes Conducted",
      value: isLoadingDashboard ? "-" : String(dashboard?.completedClasses ?? 0),
      icon: Calendar,
      color: "#ff691d",
    },
    {
      title: "Total Sādhakas Taught",
      value: isLoadingDashboard ? "-" : String(dashboard?.totalStudents ?? 0),
      icon: Users,
      color: "#10b981",
    },
    {
      title: "Teaching Hours (Month)",
      value: isLoadingDashboard ? "-" : formatHours(dashboard?.teachingHoursThisMonth ?? 0),
      icon: Clock,
      color: "#a855f7",
    },
    {
      title: "My Attendance Rate",
      value: isLoadingDashboard ? "-" : `${dashboard?.avgAttendanceRate ?? 0}%`,
      icon: TrendingUp,
      color: "#ff691d",
    },
  ];

  // Build weekly bar chart from history (last 4 weeks)
  const weeklyActivity = (() => {
    const weeks: { week: string; classes: number }[] = [
      { week: "Week 1", classes: 0 },
      { week: "Week 2", classes: 0 },
      { week: "Week 3", classes: 0 },
      { week: "Week 4", classes: 0 },
    ];
    const now = new Date();
    history.forEach((rec) => {
      const d = new Date(rec.date);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      const weekIdx = Math.floor(diffDays / 7);
      if (weekIdx >= 0 && weekIdx < 4) {
        weeks[3 - weekIdx].classes += rec.classesConducted ?? 0;
      }
    });
    return weeks;
  })();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#610981] via-[#a020c8] to-[#ff691d] p-6 sm:p-8 text-white shadow-2xl shadow-[#ffac96]/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Award className="w-9 h-9 shrink-0" strokeWidth={2.25} />
              <div>
                <h1 className="text-3xl font-bold mb-1">Teaching Activity</h1>
                <p className="text-white/85 text-base">
                  Track your classes and teaching performance
                </p>
              </div>
            </div>
            {/* Today's attendance action */}
            <div className="relative z-10">
              {isLoadingDashboard ? null : todayRecord ? (
                <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2.5">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span className="text-sm font-medium">Marked today</span>
                </div>
              ) : (
                <Button
                  onClick={handleMarkAttendance}
                  disabled={isMarking}
                  className="bg-white text-[#610981] hover:bg-white/90 font-semibold shadow-lg"
                >
                  {isMarking ? "Marking…" : "Mark Today's Attendance"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Today's record banner (if marked) */}
        {todayRecord && (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-3.5">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <div className="text-sm text-green-800">
              <span className="font-semibold">Today marked as Present</span>
              {todayRecord.classesConducted > 0 && (
                <span className="ml-2 text-green-700">
                  · {todayRecord.classesConducted} class{todayRecord.classesConducted !== 1 ? "es" : ""}
                  {todayRecord.teachingHours > 0 && ` · ${formatHours(todayRecord.teachingHours)}`}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Primary stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {primaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow"
                style={{
                  background: `radial-gradient(circle at top right, ${stat.color}40 0%, ${stat.color}14 35%, #ffffff 75%)`,
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md"
                    style={{ backgroundColor: stat.color }}
                  >
                    <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary stats from history */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Total Days Recorded", value: historySummary.total, color: "#610981" },
            { label: "Days Present", value: historySummary.present, color: "#10b981" },
            { label: "Attendance Rate", value: `${historySummary.attendanceRate}%`, color: "#ff691d" },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-md">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly activity chart */}
        <Card className="relative overflow-hidden border-0 shadow-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff691d]/5 rounded-full blur-3xl" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2" style={{ color: "#ff691d" }}>
              <Calendar className="w-5 h-5" />
              Weekly Teaching Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={weeklyActivity}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="week"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255, 105, 29, 0.05)" }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #ffac96",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(255, 172, 150, 0.2)",
                  }}
                />
                <Bar dataKey="classes" fill="#ff691d" radius={[6, 6, 0, 0]} barSize={120} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance history */}
        <Card className="relative overflow-hidden border-0 shadow-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffac96]/5 rounded-full blur-3xl" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2" style={{ color: "#ff691d" }}>
              <BookOpen className="w-5 h-5" />
              Attendance History
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Page {historyPage} of {historyTotalPages}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={historyPage <= 1 || isLoadingHistory}
                onClick={() => setHistoryPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={historyPage >= historyTotalPages || isLoadingHistory}
                onClick={() => setHistoryPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            {isLoadingHistory ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
              ))
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <AlertCircle className="w-8 h-8 opacity-40" />
                <p className="text-sm">No attendance records yet.</p>
              </div>
            ) : (
              history.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-4 border border-border/60 rounded-xl hover:shadow-md hover:border-[#ffac96]/60 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-[#ffac96]/15">
                      <Calendar className="w-5 h-5" style={{ color: "#ff691d" }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{formatDate(rec.date)}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rec.classesConducted} class{rec.classesConducted !== 1 ? "es" : ""}
                        {Number(rec.teachingHours) > 0 && ` · ${formatHours(rec.teachingHours)}`}
                      </p>
                    </div>
                  </div>
                  {statusBadge(rec.status)}
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
