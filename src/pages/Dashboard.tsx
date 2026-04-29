import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Users, GraduationCap, Calendar, TrendingUp, IndianRupee, Award, Sparkles, Target, TrendingDown, Clock } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { students, tutors, classes, payments } from "../data/mockData";
import { Badge } from "../components/ui/badge";

const revenueData = [
  { month: 'Oct', revenue: 45000 },
  { month: 'Nov', revenue: 52000 },
  { month: 'Dec', revenue: 48000 },
  { month: 'Jan', revenue: 61000 },
  { month: 'Feb', revenue: 55000 },
  { month: 'Mar', revenue: 58000 },
];

const classPopularityData = [
  { name: 'Hatha Yoga', students: 15 },
  { name: 'Power Yoga', students: 12 },
  { name: 'Meditation', students: 20 },
  { name: 'Ashtanga', students: 8 },
];

const membershipData = [
  { name: 'Monthly', value: 2 },
  { name: 'Quarterly', value: 1 },
  { name: 'Yearly', value: 2 },
];

const COLORS = ['#610981', '#ff691d', '#ffac96'];

export function Dashboard() {
  const activeStudents = students.filter(s => s.status === 'active').length;
  const activeTutors = tutors.filter(t => t.status === 'active').length;
  const activeClasses = classes.filter(c => c.status === 'active').length;
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const monthlyRevenue = 58000; // From latest month
  const revenueGrowth = ((monthlyRevenue - 55000) / 55000 * 100).toFixed(1);

  const stats = [
    {
      name: 'Total Students',
      value: activeStudents,
      total: students.length,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      change: '+12%',
      trend: 'up',
    },
    {
      name: 'Active Tutors',
      value: activeTutors,
      total: tutors.length,
      icon: GraduationCap,
      color: 'text-[#610981]',
      bgColor: 'bg-[#610981]/10',
      change: '+5%',
      trend: 'up',
    },
    {
      name: 'Active Classes',
      value: activeClasses,
      total: classes.length,
      icon: Calendar,
      color: 'text-[#ff691d]',
      bgColor: 'bg-[#ff691d]/10',
      change: '+8%',
      trend: 'up',
    },
    {
      name: 'Monthly Revenue',
      value: `₹${(monthlyRevenue / 1000).toFixed(0)}K`,
      icon: IndianRupee,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      change: `+${revenueGrowth}%`,
      trend: 'up',
    },
  ];

  return (
    <div className="space-y-6">
 
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#610981] to-[#8b0fa8] p-8 text-white shadow-2xl shadow-[#ffac96]/30">
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ffac96]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            
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
              <div className="flex items-center justify-between mt-2">
                {stat.total && (
                  <p className="text-xs text-muted-foreground">
                    of {stat.total} total
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs font-medium text-green-500">
                  <TrendingUp className="w-3 h-3" />
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
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
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
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-[#ff691d]/5 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>Class Popularity</CardTitle>
            <CardDescription>Number of students enrolled by class type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classPopularityData}>
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
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  key="pie"
                  data={membershipData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {membershipData.map((entry, index) => (
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
                <div className="p-3 bg-[#610981]/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-5 h-5 text-[#610981]" />
                </div>
                <div>
                  <p className="text-sm font-medium">Average Tutor Rating</p>
                  <p className="text-xs" style={{ color: '#ffac96' }}>Based on student feedback</p>
                </div>
              </div>
              <span className="text-2xl font-bold">4.8</span>
            </div>

            <div className="group relative flex items-center justify-between p-4 border border-border/50 rounded-xl hover:shadow-lg hover:shadow-[#ffac96]/20 transition-all duration-300 hover:border-[#ffac96]/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Class Capacity</p>
                  <p className="text-xs" style={{ color: '#ffac96' }}>Average enrollment rate</p>
                </div>
              </div>
              <span className="text-2xl font-bold">78%</span>
            </div>

            <div className="group relative flex items-center justify-between p-4 border border-border/50 rounded-xl hover:shadow-lg hover:shadow-[#ffac96]/20 transition-all duration-300 hover:border-[#ffac96]/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Attendance Rate</p>
                  <p className="text-xs" style={{ color: '#ffac96' }}>Last 30 days</p>
                </div>
              </div>
              <span className="text-2xl font-bold">92%</span>
            </div>
          </CardContent>
        </Card>
      </div>
 
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-[#ff691d]/5 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>Recent Activity</CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#610981]/5 border border-[#610981]/10 hover:border-[#610981]/30 transition-colors">
              <div className="p-2 bg-[#610981] rounded-lg mt-0.5">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New student enrolled</p>
                <p className="text-xs text-muted-foreground">Priya Sharma joined Hatha Yoga class</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  2 hours ago
                </p>
              </div>
              <Badge variant="default">New</Badge>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#ff691d]/5 border border-[#ff691d]/10 hover:border-[#ff691d]/30 transition-colors">
              <div className="p-2 bg-[#ff691d] rounded-lg mt-0.5">
                <IndianRupee className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Payment received</p>
                <p className="text-xs text-muted-foreground">₹1,500 from Raj Kumar for membership</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  5 hours ago
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#ffac96]/10 border border-[#ffac96]/20 hover:border-[#ffac96]/40 transition-colors">
              <div className="p-2 bg-[#ffac96] rounded-lg mt-0.5">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Class scheduled</p>
                <p className="text-xs text-muted-foreground">Power Yoga session added for tomorrow</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  1 day ago
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#610981]/10 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>Quick Stats</CardTitle>
            <CardDescription>At a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#610981]/10 to-[#ff691d]/5">
              <p className="text-xs font-medium" style={{ color: '#ffac96' }}>Today's Classes</p>
              <p className="text-2xl font-bold mt-1">8</p>
            </div>
            
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#ff691d]/10 to-[#ffac96]/10">
              <p className="text-xs font-medium" style={{ color: '#ffac96' }}>Pending Payments</p>
              <p className="text-2xl font-bold mt-1">₹12K</p>
            </div>
            
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#ffac96]/20 to-[#610981]/5">
              <p className="text-xs font-medium" style={{ color: '#ffac96' }}>New Leads</p>
              <p className="text-2xl font-bold mt-1">15</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}