import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Award,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  Flame,
  Target,
  Video,
  BookOpen,
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

const primaryStats = [
  {
    title: "Classes Conducted",
    value: "156",
    icon: Calendar,
    color: "#ff691d",
  },
  {
    title: "Total Students Taught",
    value: "342",
    icon: Users,
    color: "#10b981",
  },
  {
    title: "Teaching Hours",
    value: "234h",
    icon: Clock,
    color: "#a855f7",
  },
  {
    title: "Avg Attendance Rate",
    value: "94%",
    icon: TrendingUp,
    color: "#ff691d",
  },
];

const secondaryStats = [
  {
    title: "Classes This Month",
    value: "32",
    valueColor: "#ff691d",
    icon: Calendar,
    color: "#ff691d",
    subtext: "+6 from last month",
  },
  {
    title: "Avg Students/Class",
    value: "24",
    valueColor: "#10b981",
    icon: Users,
    color: "#10b981",
    subtext: "Capacity: 30",
  },
  {
    title: "Current Streak",
    value: "45 days",
    valueColor: "#f59e0b",
    icon: Flame,
    color: "#f59e0b",
    subtext: "Personal best: 62 days",
  },
  {
    title: "Monthly Target",
    value: "91%",
    valueColor: "#a855f7",
    icon: Target,
    color: "#a855f7",
    subtext: "29 of 32 classes",
  },
];

const weeklyActivity = [
  { week: "Week 1", classes: 7 },
  { week: "Week 2", classes: 8 },
  { week: "Week 3", classes: 9 },
  { week: "Week 4", classes: 8 },
];

const recentClasses = [
  {
    id: 1,
    name: "Advanced Hatha Yoga",
    date: "Apr 28, 2026",
    time: "6:00 PM",
    duration: "60 min",
  },
  {
    id: 2,
    name: "Pranayama Basics",
    date: "Apr 28, 2026",
    time: "7:00 AM",
    duration: "45 min",
  },
  {
    id: 3,
    name: "Meditation & Mindfulness",
    date: "Apr 27, 2026",
    time: "8:00 AM",
    duration: "30 min",
  },
  {
    id: 4,
    name: "Power Yoga Flow",
    date: "Apr 27, 2026",
    time: "6:30 PM",
    duration: "75 min",
  },
];

export function TutorAttendance() {
  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#610981] via-[#a020c8] to-[#ff691d] p-8 text-white shadow-2xl shadow-[#ffac96]/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center gap-4">
            <Award className="w-9 h-9" strokeWidth={2.25} />
            <div>
              <h1 className="text-3xl font-bold mb-1">Teaching Activity</h1>
              <p className="text-white/85 text-base">
                Track your classes and teaching performance
              </p>
            </div>
          </div>
        </div>

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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {secondaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow"
                style={{
                  background: `radial-gradient(circle at top right, ${stat.color}1f 0%, ${stat.color}08 30%, #ffffff 65%)`,
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}1f` }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: stat.color }}
                      strokeWidth={2.25}
                    />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div
                    className="text-2xl font-bold mb-1"
                    style={{ color: stat.valueColor }}
                  >
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="relative overflow-hidden border-0 shadow-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff691d]/5 rounded-full blur-3xl" />
          <CardHeader className="relative z-10">
            <CardTitle
              className="flex items-center gap-2"
              style={{ color: "#ff691d" }}
            >
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
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
                  domain={[0, 12]}
                  ticks={[0, 3, 6, 9, 12]}
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
                <Bar
                  dataKey="classes"
                  fill="#ff691d"
                  radius={[6, 6, 0, 0]}
                  barSize={120}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffac96]/5 rounded-full blur-3xl" />
          <CardHeader className="relative z-10">
            <CardTitle
              className="flex items-center gap-2"
              style={{ color: "#ff691d" }}
            >
              <BookOpen className="w-5 h-5" />
              Recent Classes Conducted
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            {recentClasses.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between p-4 border border-border/60 rounded-xl hover:shadow-md hover:border-[#ffac96]/60 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-[#ffac96]/15">
                    <Video className="w-5 h-5" style={{ color: "#ff691d" }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{cls.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cls.date} at {cls.time} • {cls.duration}
                    </p>
                  </div>
                </div>
                <Badge
                  className="bg-green-100 text-green-700 hover:bg-green-100 border-0"
                >
                  Live
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
