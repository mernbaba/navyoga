import { useMemo, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Gift,
  Users,
  GraduationCap,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  Search,
} from "lucide-react";

type ReferralStatus = "Active" | "Pending" | "Expired";

type ReferralRow = {
  id: string;
  referrer: { name: string; email: string };
  referee: { name: string; email: string };
  date: string;
  status: ReferralStatus;
  reward: number;
  subscription?: string;
  specialization?: string;
  classes?: number;
};

type ReferralCategory = "users" | "tutors";

const userReferrals: ReferralRow[] = [
  {
    id: "UR001",
    referrer: { name: "Sarah Johnson", email: "sarah.j@email.com" },
    referee: { name: "Emma Davis", email: "emma.d@email.com" },
    date: "2026-04-15",
    subscription: "Monthly",
    status: "Active",
    reward: 300,
  },
  {
    id: "UR002",
    referrer: { name: "Michael Chen", email: "michael.c@email.com" },
    referee: { name: "David Lee", email: "david.l@email.com" },
    date: "2026-04-12",
    subscription: "Quarterly",
    status: "Active",
    reward: 300,
  },
  {
    id: "UR003",
    referrer: { name: "Priya Patel", email: "priya.p@email.com" },
    referee: { name: "Rahul Sharma", email: "rahul.s@email.com" },
    date: "2026-04-28",
    subscription: "Not subscribed yet",
    status: "Pending",
    reward: 0,
  },
  {
    id: "UR004",
    referrer: { name: "Sarah Johnson", email: "sarah.j@email.com" },
    referee: { name: "Lisa Anderson", email: "lisa.a@email.com" },
    date: "2026-04-10",
    subscription: "Half-Yearly",
    status: "Active",
    reward: 300,
  },
  {
    id: "UR005",
    referrer: { name: "Alex Thompson", email: "alex.t@email.com" },
    referee: { name: "Nina Martinez", email: "nina.m@email.com" },
    date: "2026-04-08",
    subscription: "Monthly",
    status: "Active",
    reward: 300,
  },
  {
    id: "UR006",
    referrer: { name: "Michael Chen", email: "michael.c@email.com" },
    referee: { name: "John Walker", email: "john.w@email.com" },
    date: "2026-03-20",
    subscription: "Cancelled",
    status: "Expired",
    reward: 0,
  },
  {
    id: "UR007",
    referrer: { name: "Emma Wilson", email: "emma.w@email.com" },
    referee: { name: "Sophia Brown", email: "sophia.b@email.com" },
    date: "2026-04-18",
    subscription: "Yearly",
    status: "Active",
    reward: 300,
  },
  {
    id: "UR008",
    referrer: { name: "Priya Patel", email: "priya.p@email.com" },
    referee: { name: "James Taylor", email: "james.t@email.com" },
    date: "2026-04-27",
    subscription: "Not subscribed yet",
    status: "Pending",
    reward: 0,
  },
];

const tutorReferrals: ReferralRow[] = [
  {
    id: "TR001",
    referrer: { name: "Dr. Anita Desai", email: "anita.s@email.com" },
    referee: { name: "Vikram Singh", email: "vikram.s@email.com" },
    date: "2026-04-20",
    specialization: "Hatha Yoga",
    classes: 12,
    status: "Active",
    reward: 3000,
  },
  {
    id: "TR002",
    referrer: { name: "Raj Kumar", email: "raj.k@email.com" },
    referee: { name: "Maya Gupta", email: "maya.g@email.com" },
    date: "2026-04-05",
    specialization: "Vinyasa Flow",
    classes: 6,
    status: "Active",
    reward: 3000,
  },
  {
    id: "TR003",
    referrer: { name: "Dr. Anita Desai", email: "anita.d@email.com" },
    referee: { name: "Arjun Mehta", email: "arjun.m@email.com" },
    date: "2026-04-26",
    specialization: "Not verified yet",
    classes: 0,
    status: "Pending",
    reward: 0,
  },
  {
    id: "TR004",
    referrer: { name: "Lakshmi Iyer", email: "lakshmi.i@email.com" },
    referee: { name: "Neha Kapoor", email: "neha.k@email.com" },
    date: "2026-03-28",
    specialization: "Kundalini",
    classes: 15,
    status: "Active",
    reward: 3000,
  },
  {
    id: "TR005",
    referrer: { name: "Raj Kumar", email: "raj.k@email.com" },
    referee: { name: "Rohan Joshi", email: "rohan.j@email.com" },
    date: "2026-04-14",
    specialization: "Ashtanga",
    classes: 6,
    status: "Active",
    reward: 3000,
  },
];

const categoryMeta: Record<ReferralCategory, {
  title: string;
  subtitle: string;
  icon: typeof Users;
  totalLabel: string;
  activeLabel: string;
  pendingLabel: string;
  rewardLabel: string;
}> = {
  users: {
    title: "User Referrals",
    subtitle: "Track all user referral activities",
    icon: Users,
    totalLabel: "All user referrals",
    activeLabel: "Subscribed users",
    pendingLabel: "Awaiting subscription",
    rewardLabel: "Paid to referrers",
  },
  tutors: {
    title: "Tutor Referrals",
    subtitle: "Track all tutor referral activities",
    icon: GraduationCap,
    totalLabel: "All tutor referrals",
    activeLabel: "Verified tutors",
    pendingLabel: "Awaiting verification",
    rewardLabel: "Paid to referrers",
  },
};

const statusStyle: Record<ReferralStatus, { pill: string; icon: typeof CheckCircle2 }> = {
  Active: { pill: "bg-green-500", icon: CheckCircle2 },
  Pending: { pill: "bg-amber-500", icon: Clock },
  Expired: { pill: "bg-red-500", icon: XCircle },
};

export function Referrals() {
  const [category, setCategory] = useState<ReferralCategory>("users");
  const [searchQuery, setSearchQuery] = useState("");

  const meta = categoryMeta[category];
  const records = category === "users" ? userReferrals : tutorReferrals;

  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const extra = r.subscription ?? r.specialization ?? "";
      return (
        r.referrer.name.toLowerCase().includes(q) ||
        r.referee.name.toLowerCase().includes(q) ||
        r.referrer.email.toLowerCase().includes(q) ||
        r.referee.email.toLowerCase().includes(q) ||
        extra.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
      );
    });
  }, [records, searchQuery]);

  const totalReferrals = records.length;
  const activeReferrals = records.filter((r) => r.status === "Active").length;
  const pendingReferrals = records.filter((r) => r.status === "Pending").length;
  const totalRewards = records.reduce((sum, r) => sum + r.reward, 0);

  const stats = [
    {
      name: "Total Referrals",
      value: String(totalReferrals),
      change: meta.totalLabel,
      icon: Gift,
      iconBg: "bg-[#3b82f6]",
    },
    {
      name: "Active",
      value: String(activeReferrals),
      change: meta.activeLabel,
      icon: CheckCircle2,
      iconBg: "bg-[#10b981]",
    },
    {
      name: "Pending",
      value: String(pendingReferrals),
      change: meta.pendingLabel,
      icon: Clock,
      iconBg: "bg-[#f59e0b]",
    },
    {
      name: "Total Rewards",
      value: `₹${totalRewards.toLocaleString()}`,
      change: meta.rewardLabel,
      icon: IndianRupee,
      iconBg: "bg-[#ef4444]",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#610981] via-[#a020c8] to-[#ff691d] p-7 text-white shadow-2xl shadow-[#ffac96]/30">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-[#ffac96]/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Gift className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">Referral Management</h1>
            <p className="text-white/85 text-base mt-0.5">
              Track and manage user and tutor referrals
            </p>
          </div>
        </div>
      </div>

      <Tabs
        value={category}
        onValueChange={(v) => {
          setCategory(v as ReferralCategory);
          setSearchQuery("");
        }}
      >
        <TabsList className="grid w-full max-w-xl grid-cols-2 h-12 bg-muted/30 p-1.5 gap-1 rounded-xl border border-border/40">
          <TabsTrigger
            value="users"
            className="h-full rounded-lg gap-2 text-gray-400 bg-transparent border-0 transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#610981] data-[state=active]:font-semibold"
          >
            <Users className="w-4 h-4" />
            User Referrals
          </TabsTrigger>
          <TabsTrigger
            value="tutors"
            className="h-full rounded-lg gap-2 text-gray-400 bg-transparent border-0 transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#610981] data-[state=active]:font-semibold"
          >
            <GraduationCap className="w-4 h-4" />
            Tutor Referrals
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-border/60 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-muted-foreground">{stat.name}</p>
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.iconBg}`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-2">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-none">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "#ff691d" }}>
                {meta.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{meta.subtitle}</p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 z-10 pointer-events-none" />
              <Input
                placeholder="Search referrals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/40 border-border/50"
              />
            </div>
          </div>

          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-gray-700 font-bold">Referrer</TableHead>
                  <TableHead className="text-gray-700 font-bold">Referee</TableHead>
                  <TableHead className="text-gray-700 font-bold">Date</TableHead>
                  {category === "users" ? (
                    <TableHead className="text-gray-700 font-bold">Subscription</TableHead>
                  ) : (
                    <>
                      <TableHead className="text-gray-700 font-bold">Specialization</TableHead>
                      <TableHead className="text-gray-700 font-bold">Classes</TableHead>
                    </>
                  )}
                  <TableHead className="text-gray-700 font-bold">Status</TableHead>
                  <TableHead className="text-gray-700 font-bold">Reward</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((row) => {
                    const StatusIcon = statusStyle[row.status].icon;
                    const subscriptionMuted =
                      row.subscription === "Not subscribed yet" ||
                      row.subscription === "Cancelled";
                    const specializationMuted = row.specialization === "Not verified yet";
                    return (
                      <TableRow key={row.id} className="border-border/40">
                        <TableCell>
                          <div className="font-medium">{row.referrer.name}</div>
                          <div className="text-xs text-muted-foreground">{row.referrer.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{row.referee.name}</div>
                          <div className="text-xs text-muted-foreground">{row.referee.email}</div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(row.date).toLocaleDateString("en-CA")}
                        </TableCell>
                        {category === "users" ? (
                          <TableCell className={subscriptionMuted ? "text-sm text-muted-foreground" : "text-sm"}>
                            {row.subscription}
                          </TableCell>
                        ) : (
                          <>
                            <TableCell className={specializationMuted ? "text-sm text-muted-foreground" : "text-sm"}>
                              {row.specialization}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center justify-center min-w-[2.25rem] px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#610981]/10 text-[#610981]">
                                {row.classes ?? 0}
                              </span>
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${statusStyle[row.status].pill}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {row.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm font-semibold ${row.reward > 0 ? "text-green-600" : "text-gray-400"}`}
                          >
                            ₹{row.reward.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={category === "users" ? 6 : 7} className="text-center text-muted-foreground py-8">
                      No referrals found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
