import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  IndianRupee,
  TrendingUp,
  Users,
  Zap,
  Heart,
  GraduationCap,
  Crown,
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
} from "recharts";

const monthlyData = [
  { month: "Oct", revenue: 145000, subscriptions: 289 },
  { month: "Nov", revenue: 162000, subscriptions: 312 },
  { month: "Dec", revenue: 158000, subscriptions: 298 },
  { month: "Jan", revenue: 181000, subscriptions: 342 },
  { month: "Feb", revenue: 175000, subscriptions: 328 },
  { month: "Mar", revenue: 198000, subscriptions: 365 },
];

const subscriptionBreakdown = [
  { name: "Live Yoga - Inaugural", value: 145, revenue: 72550, color: "#ff691d" },
  { name: "Live Yoga - Regular", value: 89, revenue: 88911, color: "#ff9d5c" },
  { name: "Self-Paced", value: 78, revenue: 31122, color: "#ffac96" },
  { name: "YTT Self-Paced", value: 23, revenue: 183977, color: "#610981" },
  { name: "YTT Live", value: 12, revenue: 215988, color: "#8b2fb8" },
];

const planDistribution = [
  { name: "Monthly", value: 187, color: "#ff691d" },
  { name: "Quarterly", value: 98, color: "#ffac96" },
  { name: "Half-Yearly", value: 45, color: "#610981" },
  { name: "Yearly", value: 35, color: "#8b2fb8" },
];

export function FinancialsOverview() {
  const totalSubscriptions = subscriptionBreakdown.reduce((sum, s) => sum + s.value, 0);
  const subscriptionRevenue = subscriptionBreakdown.reduce((sum, s) => sum + s.revenue, 0);
  const avgRevenuePerSubscription = Math.round(subscriptionRevenue / totalSubscriptions);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold flex items-center gap-1">
              <IndianRupee className="w-6 h-6" />
              {subscriptionRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-green-500 flex items-center gap-2">
              <Users className="w-6 h-6" />
              {totalSubscriptions}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Across all plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Avg. Revenue/User</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="text-3xl font-semibold flex items-center gap-1"
              style={{ color: "#610981" }}
            >
              <IndianRupee className="w-6 h-6" />
              {avgRevenuePerSubscription.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Per subscription</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold flex items-center gap-2">
              13.1%
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">vs. last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ff691d" }}>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ff691d"
                  strokeWidth={3}
                  dot={{ fill: "#ff691d", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ff691d" }}>Subscription Growth</CardTitle>
            <CardDescription>New subscriptions per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                />
                <Bar dataKey="subscriptions" fill="#610981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ff691d" }}>Revenue by Subscription Type</CardTitle>
            <CardDescription>Distribution of revenue across different plans</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {subscriptionBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ff691d" }}>Plan Duration Distribution</CardTitle>
            <CardDescription>Subscribers by billing cycle</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: "#ff691d" }}>
          Subscription Breakdown
        </h2>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {subscriptionBreakdown.map((sub, index) => (
            <Card key={index} className="relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
                style={{ backgroundColor: sub.color }}
              />
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${sub.color}20` }}>
                    {index === 0 && <Zap className="w-5 h-5" style={{ color: sub.color }} />}
                    {index === 1 && <Crown className="w-5 h-5" style={{ color: sub.color }} />}
                    {index === 2 && <Heart className="w-5 h-5" style={{ color: sub.color }} />}
                    {(index === 3 || index === 4) && (
                      <GraduationCap className="w-5 h-5" style={{ color: sub.color }} />
                    )}
                  </div>
                  <CardTitle className="text-sm" style={{ color: sub.color }}>
                    {sub.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold">{sub.value}</p>
                    <p className="text-xs text-muted-foreground">Subscribers</p>
                  </div>
                  <div>
                    <p
                      className="text-lg font-semibold flex items-center gap-1"
                      style={{ color: sub.color }}
                    >
                      <IndianRupee className="w-4 h-4" />
                      {sub.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
