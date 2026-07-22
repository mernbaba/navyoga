import { useEffect, useState } from "react";
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
  Loader2,
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
import { toast } from "sonner";
import {
  getFinancialsOverview,
  type FinancialsOverview as FinancialsOverviewData,
} from "../../../api/financials";

const SUBSCRIPTION_COLORS = ["#ff691d", "#ff9d5c", "#ffac96", "#610981", "#8b2fb8"] as const;
const PLAN_COLORS = ["#ff691d", "#ffac96", "#610981", "#8b2fb8", "#ff9d5c"] as const;

export function FinancialsOverview() {
  const [data, setData] = useState<FinancialsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFinancialsOverview("SUPERADMIN")
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load financials";
          toast.error(message);
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading financials…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground py-20">
        No financial data available.
      </div>
    );
  }

  const subscriptionBreakdown = data.subscriptionBreakdown.map((s, i) => ({
    ...s,
    color: SUBSCRIPTION_COLORS[i % SUBSCRIPTION_COLORS.length],
  }));
  const planDistribution = data.planDistribution.map((p, i) => ({
    ...p,
    color: PLAN_COLORS[i % PLAN_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold flex items-center gap-1">
              <IndianRupee className="w-6 h-6" />
              {data.revenue.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Aggregate revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-green-500 flex items-center gap-2">
              <Users className="w-6 h-6" />
              {data.subscriptions}
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
              {data.avgRevenue.toLocaleString()}
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
              {data.growth}%
              <TrendingUp
                className={`w-5 h-5 ${data.growth >= 0 ? "text-green-500" : "text-red-500"}`}
              />
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
              <LineChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
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
              <BarChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
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
            {subscriptionBreakdown.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                No subscription revenue yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subscriptionBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ff691d" }}>Plan Distribution</CardTitle>
            <CardDescription>Subscribers by plan</CardDescription>
          </CardHeader>
          <CardContent>
            {planDistribution.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                No active plans yet
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: "#ff691d" }}>
          Subscription Breakdown
        </h2>
        {subscriptionBreakdown.length === 0 ? (
          <Card>
            <CardContent className="text-center text-muted-foreground py-10">
              No subscription data yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {subscriptionBreakdown.map((sub, index) => (
              <Card key={sub.name} className="relative overflow-hidden">
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
                      {index >= 3 && (
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
        )}
      </div>
    </div>
  );
}
