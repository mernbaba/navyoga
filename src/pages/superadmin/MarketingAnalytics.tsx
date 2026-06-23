import { useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import {
  BarChart3,
  Users,
  Activity,
  Globe2,
  TrendingUp,
  PieChart as PieChartIcon,
  MapPin,
  LineChart as LineChartIcon,
} from "lucide-react";
import { toast } from "sonner";
import { getMarketingAnalytics, type MarketingAnalytics as MarketingAnalyticsData } from "../../api/dashboard";
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

const ACTIVITY_STYLE: Record<string, { border: string; bar: string }> = {
  "#10b981": { border: "border-green-200", bar: "bg-green-500" },
  "#f59e0b": { border: "border-amber-200", bar: "bg-amber-500" },
  "#ef4444": { border: "border-red-200", bar: "bg-red-500" },
};

const buildStats = (
  s: MarketingAnalyticsData["stats"],
): Array<{
  name: string;
  value: string;
  change: string;
  changeNeutral?: boolean;
  icon: typeof Users;
  iconBg: string;
  cardBg: string;
}> => [
  {
    name: "Total Users",
    value: s.totalUsers.toLocaleString(),
    change: "All registered",
    changeNeutral: true,
    icon: Users,
    iconBg: "bg-linear-to-br from-[#ef4444] to-[#ff691d]",
    cardBg: "bg-linear-to-br from-[#ff691d]/10 via-white to-white",
  },
  {
    name: "Active Users",
    value: s.activeUsers.toLocaleString(),
    change: "Currently active",
    icon: Activity,
    iconBg: "bg-linear-to-br from-[#10b981] to-[#059669]",
    cardBg: "bg-linear-to-br from-[#10b981]/10 via-white to-white",
  },
  {
    name: "Countries",
    value: s.countries.toLocaleString(),
    change: "Represented",
    changeNeutral: true,
    icon: Globe2,
    iconBg: "bg-linear-to-br from-[#a020c8] to-[#610981]",
    cardBg: "bg-linear-to-br from-[#610981]/10 via-white to-white",
  },
  {
    name: "Avg. Age",
    value: s.avgAge ? s.avgAge.toFixed(1) : "-",
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
  const [data, setData] = useState<MarketingAnalyticsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMarketingAnalytics("SUPERADMIN")
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load analytics";
          toast.error(message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = buildStats(
    data?.stats ?? { totalUsers: 0, activeUsers: 0, countries: 0, avgAge: 0 },
  );
  const ageDistribution = data?.ageDistribution ?? [];
  const genderDistribution = data?.genderDistribution ?? [];
  const topCities = data?.topCities ?? [];
  const countryDistribution = data?.countryDistribution ?? [];
  const userGrowth = data?.userGrowth ?? [];
  const subscriptionPlans = data?.subscriptionPlans ?? [];
  const activityStatus = (data?.activityStatus ?? []).map((s) => ({
    ...s,
    border: ACTIVITY_STYLE[s.color]?.border ?? "border-border/50",
    bar: ACTIVITY_STYLE[s.color]?.bar ?? "bg-gray-500",
  }));

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

        <div className="space-y-6 mt-6">
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
        </div>
    </div>
  );
}
