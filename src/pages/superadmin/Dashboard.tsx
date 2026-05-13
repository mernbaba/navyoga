import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Users, GraduationCap, UserPlus, TrendingUp, IndianRupee, Sparkles, TrendingDown, BarChart3, Gift, ArrowRight, CalendarDays, BadgeCheck } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "../../components/ui/badge";
import { Link } from "react-router";
import { getSuperadminDashboard, type SuperadminDashboard } from "../../api/dashboard";
import { toast } from "sonner";

const COLORS = ['#610981', '#ff691d', '#ffac96'];

const formatDiff = (diff: number): string => {
  if (diff === 0) return "0";
  return diff > 0 ? `+${diff}` : `${diff}`;
};

export function Dashboard() {
  const [data, setData] = useState<SuperadminDashboard | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSuperadminDashboard("SUPERADMIN")
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load dashboard";
          toast.error(message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const studentsTotal = data?.cards.students.total ?? 0;
  const studentsDiff = data?.cards.students.diff ?? 0;
  const tutorsTotal = data?.cards.tutors.total ?? 0;
  const tutorsDiff = data?.cards.tutors.diff ?? 0;
  const leadsTotal = data?.cards.leads.total ?? 0;
  const leadsDiff = data?.cards.leads.diff ?? 0;
  const revenueTotal = data?.cards.revenue.total ?? 0;
  const revenueDiff = data?.cards.revenue.diff ?? 0;

  const referralsCount = data?.performance.referrals ?? null;
  const eventsAndWorkshops = data?.performance.eventsAndWorkshops ?? null;
  const subscriptionsCount = data?.performance.subscriptions ?? null;

  const revenueChartData = data?.revenue ?? [];
  const popularityChartData = data?.popularity ?? [];
  const membershipChartData = data?.membership ?? [];

  const stats = [
    {
      name: 'Total Students',
      value: studentsTotal,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      change: formatDiff(studentsDiff),
      trend: studentsDiff >= 0 ? 'up' : 'down',
    },
    {
      name: 'Active Tutors',
      value: tutorsTotal,
      icon: GraduationCap,
      color: 'text-[#610981]',
      bgColor: 'bg-[#610981]/10',
      change: formatDiff(tutorsDiff),
      trend: tutorsDiff >= 0 ? 'up' : 'down',
    },
    {
      name: 'Total Leads',
      value: leadsTotal,
      icon: UserPlus,
      color: 'text-[#ff691d]',
      bgColor: 'bg-[#ff691d]/10',
      change: formatDiff(leadsDiff),
      trend: leadsDiff >= 0 ? 'up' : 'down',
    },
    {
      name: 'Monthly Revenue',
      value: revenueTotal > 0 ? `₹${(revenueTotal / 1000).toFixed(0)}K` : '₹0',
      icon: IndianRupee,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      change: formatDiff(revenueDiff),
      trend: revenueDiff >= 0 ? 'up' : 'down',
    },
  ];

  return (
    <div className="space-y-6">

      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#610981] to-[#8b0fa8] p-8 text-white shadow-2xl shadow-[#ffac96]/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff691d]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#ffac96]/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              Super Admin
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-2">Welcome Back! 👋</h1>
          <p className="text-white/80 text-lg">Here's what's happening with NavYoga Academy today</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="relative overflow-hidden group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-[#ffac96]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#ffac96' }}>
                {stat.name}
              </CardTitle>
              <div className={`p-2.5 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="flex items-center justify-end mt-2">
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#610981]/5 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis key="xaxis" dataKey="month" stroke="#9ca3af" />
                  <YAxis key="yaxis" stroke="#9ca3af" />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ffac96',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(255, 172, 150, 0.2)'
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Line
                    key="line"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#610981"
                    strokeWidth={3}
                    dot={{ fill: '#ff691d', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#ff691d' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-[#ff691d]/5 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>Class Popularity</CardTitle>
            <CardDescription>Number of students enrolled by class type</CardDescription>
          </CardHeader>
          <CardContent>
            {popularityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={popularityChartData}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis key="xaxis" dataKey="name" stroke="#9ca3af" />
                  <YAxis key="yaxis" stroke="#9ca3af" />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ffac96',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(255, 172, 150, 0.2)'
                    }}
                    formatter={(value: number) => [`${value} students`, 'Enrolled']}
                  />
                  <Bar
                    key="bar"
                    dataKey="students"
                    fill="#610981"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#ffac96]/10 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>Membership Distribution</CardTitle>
            <CardDescription>Active students by membership type</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {membershipChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    key="pie"
                    data={membershipChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {membershipChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    key="tooltip"
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ffac96',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(255, 172, 150, 0.2)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#610981]/5 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="group relative flex items-center justify-between p-4 border border-border/50 rounded-xl hover:shadow-lg hover:shadow-[#ffac96]/20 transition-all duration-300 hover:border-[#ffac96]/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#ff691d]/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Gift className="w-5 h-5 text-[#ff691d]" />
                </div>
                <div>
                  <p className="text-sm font-medium">Total Referrals</p>
                  <p className="text-xs" style={{ color: '#ffac96' }}>All-time referral count</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{referralsCount != null ? referralsCount.toLocaleString() : "—"}</span>
            </div>

            <div className="group relative flex items-center justify-between p-4 border border-border/50 rounded-xl hover:shadow-lg hover:shadow-[#ffac96]/20 transition-all duration-300 hover:border-[#ffac96]/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <CalendarDays className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Events &amp; Workshops</p>
                  <p className="text-xs" style={{ color: '#ffac96' }}>Total enrollments</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{eventsAndWorkshops != null ? eventsAndWorkshops.toLocaleString() : "—"}</span>
            </div>

            <div className="group relative flex items-center justify-between p-4 border border-border/50 rounded-xl hover:shadow-lg hover:shadow-[#ffac96]/20 transition-all duration-300 hover:border-[#ffac96]/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <BadgeCheck className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Active Subscriptions</p>
                  <p className="text-xs" style={{ color: '#ffac96' }}>Self-Paced, Live &amp; YTT</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{subscriptionsCount != null ? subscriptionsCount.toLocaleString() : "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#610981]/10 rounded-full blur-3xl" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#610981] shadow-md">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: '#ff691d' }}>Marketing Analytics</h3>
                <p className="text-sm text-muted-foreground">Comprehensive user insights and engagement metrics</p>
              </div>
            </div>

            <Link
              to="/superadmin/marketing-analytics"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-linear-to-r from-[#610981] to-[#a020c8] hover:from-[#7a0a9f] hover:to-[#b232d6] text-white font-semibold py-3 text-sm shadow-md shadow-[#610981]/30 transition-all"
            >
              View Analytics Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#ff691d]/10 rounded-full blur-3xl" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#ff691d] shadow-md">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: '#ff691d' }}>Referral Program</h3>
                <p className="text-sm text-muted-foreground">Track user and tutor referrals and rewards</p>
              </div>
            </div>

            <Link
              to="/superadmin/referrals"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-linear-to-r from-[#ff691d] to-[#ffac96] hover:from-[#ff7e3f] hover:to-[#ffbfa9] text-white font-semibold py-3 text-sm shadow-md shadow-[#ff691d]/30 transition-all"
            >
              Manage Referrals
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/*
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-[#ff691d]/5 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>Recent Activity</CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">No recent activity</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#610981]/10 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>Quick Stats</CardTitle>
            <CardDescription>At a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-linear-to-br from-[#610981]/10 to-[#ff691d]/5">
              <p className="text-xs font-medium" style={{ color: '#ffac96' }}>Today's Classes</p>
              <p className="text-2xl font-bold mt-1">—</p>
            </div>

            <div className="p-3 rounded-xl bg-linear-to-br from-[#ff691d]/10 to-[#ffac96]/10">
              <p className="text-xs font-medium" style={{ color: '#ffac96' }}>Pending Payments</p>
              <p className="text-2xl font-bold mt-1">—</p>
            </div>

            <div className="p-3 rounded-xl bg-linear-to-br from-[#ffac96]/20 to-[#610981]/5">
              <p className="text-xs font-medium" style={{ color: '#ffac96' }}>New Leads</p>
              <p className="text-2xl font-bold mt-1">—</p>
            </div>
          </CardContent>
        </Card>
      </div>
      */}
    </div>
  );
}
