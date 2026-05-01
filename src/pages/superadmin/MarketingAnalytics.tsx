import { Card, CardContent } from "../../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import {
  BarChart3,
  Users,
  Activity,
  Globe2,
  TrendingUp,
  PieChart as PieChartIcon,
  MapPin,
  LineChart as LineChartIcon,
  Smartphone,
  Monitor,
  Tablet,
  Zap,
  ArrowUpRight,
  Clock,
  MousePointerClick,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const ageDistribution = [
  { range: "18-25", users: 245 },
  { range: "26-35", users: 412 },
  { range: "36-45", users: 156 },
  { range: "46-55", users: 78 },
  { range: "55+", users: 32 },
];

const genderDistribution = [
  { name: "Female", value: 520, color: "#ff691d" },
  { name: "Male", value: 298, color: "#610981" },
  { name: "Other", value: 55, color: "#ffac96" },
];

const topCities = [
  { name: "New York", users: 234, percent: 27 },
  { name: "London", users: 189, percent: 22 },
  { name: "Los Angeles", users: 156, percent: 18 },
  { name: "Toronto", users: 123, percent: 14 },
  { name: "Sydney", users: 98, percent: 11 },
  { name: "Others", users: 73, percent: 8 },
];

const countryDistribution = [
  { name: "United States", value: 312, color: "#ff691d" },
  { name: "United Kingdom", value: 234, color: "#610981" },
  { name: "Canada", value: 187, color: "#f59e0b" },
  { name: "Australia", value: 145, color: "#10b981" },
  { name: "Others", value: 95, color: "#9ca3af" },
];

const acquisitionMedium = [
  { channel: "Organic Search", users: 312, color: "#10b981" },
  { channel: "Social Media", users: 245, color: "#3b82f6" },
  { channel: "Paid Ads", users: 187, color: "#ff691d" },
  { channel: "Referrals", users: 89, color: "#610981" },
  { channel: "Direct", users: 65, color: "#ef4444" },
  { channel: "Email", users: 45, color: "#f59e0b" },
];

const userGrowth = [
  { month: "Oct", users: 412 },
  { month: "Nov", users: 528 },
  { month: "Dec", users: 645 },
  { month: "Jan", users: 712 },
  { month: "Feb", users: 768 },
  { month: "Mar", users: 815 },
  { month: "Apr", users: 873 },
];

const subscriptionPlans = [
  { name: "Monthly", value: 456, color: "#ff691d" },
  { name: "Quarterly", value: 234, color: "#610981" },
  { name: "Half-Yearly", value: 123, color: "#f59e0b" },
  { name: "Yearly", value: 89, color: "#10b981" },
];

const deviceUsage = [
  { name: "Mobile", users: 567, percent: 65, color: "#10b981", icon: Smartphone, bg: "bg-green-100", iconColor: "text-green-600" },
  { name: "Desktop", users: 245, percent: 28, color: "#610981", icon: Monitor, bg: "bg-purple-100", iconColor: "text-[#610981]" },
  { name: "Tablet", users: 61, percent: 7, color: "#ff691d", icon: Tablet, bg: "bg-orange-100", iconColor: "text-[#ff691d]" },
];

const activityStatus = [
  { label: "Active (Last 7 days)", value: 623, percent: 71, color: "#10b981", border: "border-green-200", bar: "bg-green-500" },
  { label: "Inactive (7-30 days)", value: 156, percent: 18, color: "#f59e0b", border: "border-amber-200", bar: "bg-amber-500" },
  { label: "Dormant (30+ days)", value: 94, percent: 11, color: "#ef4444", border: "border-red-200", bar: "bg-red-500" },
];

const engagementStats = [
  {
    name: "Daily Active Users",
    value: "456",
    change: "52% of total",
    icon: Users,
    iconBg: "bg-[#ff691d]/15",
    iconColor: "text-[#ff691d]",
  },
  {
    name: "Avg Session Duration",
    value: "24m",
    change: "+3m from last month",
    icon: Clock,
    iconBg: "bg-[#610981]/15",
    iconColor: "text-[#610981]",
  },
  {
    name: "Sessions per User",
    value: "8.3",
    change: "Per week",
    icon: MousePointerClick,
    iconBg: "bg-[#10b981]/15",
    iconColor: "text-[#10b981]",
  },
  {
    name: "Retention Rate",
    value: "78%",
    change: "30-day retention",
    icon: Target,
    iconBg: "bg-[#f59e0b]/15",
    iconColor: "text-[#f59e0b]",
  },
];

const dailyEngagement = [
  { day: "Mon", sessions: 3200, activeUsers: 420 },
  { day: "Tue", sessions: 3850, activeUsers: 465 },
  { day: "Wed", sessions: 4150, activeUsers: 489 },
  { day: "Thu", sessions: 4520, activeUsers: 510 },
  { day: "Fri", sessions: 4380, activeUsers: 498 },
  { day: "Sat", sessions: 3920, activeUsers: 472 },
  { day: "Sun", sessions: 2680, activeUsers: 388 },
];

const featureUsage = [
  { name: "Live Classes", users: 686, percent: 78, color: "#ef4444", bg: "bg-[#ef4444]" },
  { name: "Recorded Classes", users: 567, percent: 65, color: "#ff691d", bg: "bg-[#ff691d]" },
  { name: "Self-Paced Courses", users: 454, percent: 52, color: "#10b981", bg: "bg-[#10b981]" },
  { name: "Events & Workshops", users: 358, percent: 41, color: "#f59e0b", bg: "bg-[#f59e0b]" },
  { name: "Referral Program", users: 297, percent: 34, color: "#3b82f6", bg: "bg-[#3b82f6]" },
  { name: "Community Forum", users: 244, percent: 28, color: "#a855f7", bg: "bg-[#a855f7]" },
];

const retentionCohort = [
  { week: "Week 1", retention: 100 },
  { week: "Week 2", retention: 84 },
  { week: "Week 3", retention: 76 },
  { week: "Week 4", retention: 72 },
  { week: "Week 5", retention: 70 },
  { week: "Week 6", retention: 68 },
  { week: "Week 7", retention: 66 },
  { week: "Week 8", retention: 65 },
];

const stats = [
  {
    name: "Total Users",
    value: "873",
    change: "+2.1%",
    icon: Users,
    iconBg: "bg-linear-to-br from-[#ef4444] to-[#ff691d]",
    cardBg: "bg-linear-to-br from-[#ff691d]/10 via-white to-white",
  },
  {
    name: "Active Users",
    value: "623",
    change: "+5.4%",
    icon: Activity,
    iconBg: "bg-linear-to-br from-[#10b981] to-[#059669]",
    cardBg: "bg-linear-to-br from-[#10b981]/10 via-white to-white",
  },
  {
    name: "Countries",
    value: "12",
    change: "+2",
    icon: Globe2,
    iconBg: "bg-linear-to-br from-[#a020c8] to-[#610981]",
    cardBg: "bg-linear-to-br from-[#610981]/10 via-white to-white",
  },
  {
    name: "Avg. Age",
    value: "31.2",
    change: "Years",
    changeNeutral: true,
    icon: TrendingUp,
    iconBg: "bg-linear-to-br from-[#f59e0b] to-[#ff691d]",
    cardBg: "bg-linear-to-br from-[#f59e0b]/10 via-white to-white",
  },
];

const sectionTitle = (Icon: typeof BarChart3, title: string, subtitle: string) => (
  <div className="flex items-start gap-2 mb-4">
    <Icon className="w-4 h-4 mt-1 text-[#ff691d]" />
    <div>
      <h3 className="text-base font-semibold" style={{ color: "#ff691d" }}>{title}</h3>
      <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  </div>
);

export function MarketingAnalytics() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#610981] via-[#a020c8] to-[#ff691d] p-7 text-white shadow-2xl shadow-[#ffac96]/30">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-[#ffac96]/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <BarChart3 className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">Marketing Analytics</h1>
            <p className="text-white/85 text-base mt-0.5">
              Comprehensive insights into user demographics, behavior, and acquisition
            </p>
          </div>
        </div>
      </div>

        <Tabs defaultValue="analytics">
          <TabsList className="grid w-full max-w-xl grid-cols-2 h-12 bg-muted/30 p-1.5 gap-1 rounded-xl border border-border/40">
            <TabsTrigger
              value="analytics"
              className="h-full rounded-lg gap-2 text-gray-400 bg-transparent border-0 transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#610981] data-[state=active]:font-semibold"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="engagement"
              className="h-full rounded-lg gap-2 text-gray-400 bg-transparent border-0 transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#610981] data-[state=active]:font-semibold"
            >
              <Zap className="w-4 h-4" />
              User Engagement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.name} className={`border-border/60 shadow-none overflow-hidden ${stat.cardBg}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm text-muted-foreground">{stat.name}</p>
                      <div className={`p-2.5 rounded-xl shadow-sm ${stat.iconBg}`}>
                        <stat.icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-xs font-medium mt-1 ${stat.changeNeutral ? "text-[#ff691d]" : "text-green-500"}`}>
                      {stat.change}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60 shadow-none">
                <CardContent className="p-6">
                  {sectionTitle(Users, "Age Distribution", "User breakdown by age groups")}
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={ageDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="range" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}
                      />
                      <Bar dataKey="users" fill="#ff691d" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-none">
                <CardContent className="p-6">
                  {sectionTitle(PieChartIcon, "Gender Distribution", "User breakdown by gender")}
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={genderDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {genderDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60 shadow-none">
                <CardContent className="p-6">
                  {sectionTitle(MapPin, "Top Cities", "User distribution across major cities")}
                  <div className="space-y-4 mt-4">
                    {topCities.map((city) => (
                      <div key={city.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium">{city.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {city.users} users <span className="ml-2 font-medium text-gray-700">{city.percent}%</span>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-[#610981] to-[#ff691d]"
                            style={{ width: `${city.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-none">
                <CardContent className="p-6">
                  {sectionTitle(Globe2, "Country Distribution", "User distribution by country")}
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={countryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {countryDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60 shadow-none">
                <CardContent className="p-6">
                  {sectionTitle(ArrowUpRight, "Acquisition Medium", "How users discovered the platform")}
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={acquisitionMedium} layout="vertical" margin={{ left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#9ca3af" />
                      <YAxis dataKey="channel" type="category" stroke="#9ca3af" width={90} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}
                      />
                      <Bar dataKey="users" radius={[0, 8, 8, 0]}>
                        {acquisitionMedium.map((entry) => (
                          <Cell key={entry.channel} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-none">
                <CardContent className="p-6">
                  {sectionTitle(LineChartIcon, "User Growth Trend", "Total user count over time")}
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#610981"
                        strokeWidth={3}
                        dot={{ fill: "#ff691d", strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, fill: "#ff691d" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60 shadow-none">
                <CardContent className="p-6">
                  {sectionTitle(PieChartIcon, "Subscription Plans", "Distribution of subscription types")}
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={subscriptionPlans}
                        cx="50%"
                        cy="50%"
                        labelLine
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {subscriptionPlans.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-none">
                <CardContent className="p-6">
                  {sectionTitle(Smartphone, "Device Usage", "User access by device type")}
                  <div className="space-y-3 mt-4">
                    {deviceUsage.map((device) => (
                      <div
                        key={device.name}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${device.bg}`}>
                            <device.icon className={`w-5 h-5 ${device.iconColor}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{device.name}</p>
                            <p className="text-xs text-muted-foreground">{device.users} users</p>
                          </div>
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: device.color }}
                        >
                          {device.percent}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60 shadow-none">
              <CardContent className="p-6">
                {sectionTitle(Activity, "User Activity Status", "User engagement levels")}
                <div className="grid gap-4 md:grid-cols-3 mt-4">
                  {activityStatus.map((status) => (
                    <div
                      key={status.label}
                      className={`rounded-xl border ${status.border} p-4 bg-white`}
                    >
                      <p className="text-sm font-medium" style={{ color: status.color }}>
                        {status.label}
                      </p>
                      <p className="text-3xl font-bold mt-2" style={{ color: status.color }}>
                        {status.value}
                      </p>
                      <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${status.bar}`}
                          style={{ width: `${status.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {engagementStats.map((stat) => (
                <Card key={stat.name} className="border-border/60 shadow-none">
                  <CardContent className="p-5">
                    <div className={`inline-flex items-center justify-center w-11 h-11 rounded-full ${stat.iconBg} mb-3`}>
                      <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm font-medium mt-1">{stat.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60 shadow-none">
                <CardContent className="p-6">
                  {sectionTitle(Activity, "Daily Engagement Trend", "Sessions and active users by day")}
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyEngagement}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sessions"
                        name="Sessions"
                        stroke="#ff691d"
                        strokeWidth={3}
                        dot={{ fill: "#ff691d", r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="activeUsers"
                        name="Active Users"
                        stroke="#610981"
                        strokeWidth={3}
                        dot={{ fill: "#610981", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-none">
                <CardContent className="p-6">
                  {sectionTitle(BarChart3, "Feature Usage", "Most popular platform features")}
                  <div className="space-y-4 mt-4">
                    {featureUsage.map((feature) => (
                      <div key={feature.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium">{feature.name}</span>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">{feature.users} users</span>
                            <span
                              className="px-2 py-0.5 rounded-full text-white font-semibold"
                              style={{ backgroundColor: feature.color }}
                            >
                              {feature.percent}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${feature.bg}`}
                            style={{ width: `${feature.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60 shadow-none">
              <CardContent className="p-6">
                {sectionTitle(Target, "User Retention Cohort", "Weekly retention rate for new users")}
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={retentionCohort}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}
                      formatter={(value: number) => [`${value}%`, "Retention"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="retention"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: "#10b981" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
