import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import {
  Gift,
  Users,
  GraduationCap,
  CheckCircle2,
  Clock,
  IndianRupee,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSuperadminUserOverview,
  getSuperadminTutorOverview,
  listSuperadminUserReferrals,
  listSuperadminTutorReferrals,
} from "../../api/referrals";
import type {
  ReferralOverview,
  StudentReferralRow,
  TutorReferralRow,
} from "../../api/types";

type ReferralStatusUI = "Active" | "Pending";

type ReferralCategory = "users" | "tutors";

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
    title: "Yoga Shikshak Referrals",
    subtitle: "Track all yoga shikshak referral activities",
    icon: GraduationCap,
    totalLabel: "All yoga shikshak referrals",
    activeLabel: "Verified yoga shikshaks",
    pendingLabel: "Awaiting verification",
    rewardLabel: "Paid to referrers",
  },
};

const statusStyle: Record<ReferralStatusUI, { pill: string; icon: typeof CheckCircle2 }> = {
  Active: { pill: "bg-green-500", icon: CheckCircle2 },
  Pending: { pill: "bg-amber-500", icon: Clock },
};

const PAGE_SIZE = 20;

export function Referrals() {
  const [category, setCategory] = useState<ReferralCategory>("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);

  const [overview, setOverview] = useState<ReferralOverview | null>(null);
  const [userItems, setUserItems] = useState<StudentReferralRow[]>([]);
  const [tutorItems, setTutorItems] = useState<TutorReferralRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const meta = categoryMeta[category];

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [category, debouncedQuery]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const params = {
      q: debouncedQuery || undefined,
      page,
      limit: PAGE_SIZE,
    };

    const overviewPromise =
      category === "users"
        ? getSuperadminUserOverview("SUPERADMIN")
        : getSuperadminTutorOverview("SUPERADMIN");
    const listPromise =
      category === "users"
        ? listSuperadminUserReferrals("SUPERADMIN", params)
        : listSuperadminTutorReferrals("SUPERADMIN", params);

    Promise.all([overviewPromise, listPromise])
      .then(([ov, list]) => {
        if (cancelled) return;
        setOverview(ov);
        setTotal(list.total);
        setTotalPages(list.totalPages);
        if (category === "users") {
          setUserItems(list.items as StudentReferralRow[]);
          setTutorItems([]);
        } else {
          setTutorItems(list.items as TutorReferralRow[]);
          setUserItems([]);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load referrals.");
      })
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [category, debouncedQuery, page]);

  const totalReferrals = overview?.total ?? 0;
  const activeReferrals = overview?.active ?? 0;
  const pendingReferrals = overview?.pending ?? 0;
  const totalRewards = useMemo(() => {
    const raw = overview?.totalRewards ?? "0";
    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
  }, [overview]);

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

  const statusToUI = (s: string): ReferralStatusUI =>
    s === "ACTIVE" ? "Active" : "Pending";

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-CA");
  };

  const renderRows = () => {
    if (category === "users") {
      if (userItems.length === 0) {
        return (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              {isLoading ? "Loading..." : "No referrals found"}
            </TableCell>
          </TableRow>
        );
      }
      return userItems.map((row) => {
        const ui = statusToUI(row.status);
        const StatusIcon = statusStyle[ui].icon;
        const reward = Number(row.reward) || 0;
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
            <TableCell className="text-sm">{formatDate(row.date)}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${statusStyle[ui].pill}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {ui}
              </span>
            </TableCell>
            <TableCell>
              <span
                className={`text-sm font-semibold ${reward > 0 ? "text-green-600" : "text-gray-400"}`}
              >
                ₹{reward.toLocaleString()}
              </span>
            </TableCell>
          </TableRow>
        );
      });
    }

    if (tutorItems.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
            {isLoading ? "Loading..." : "No referrals found"}
          </TableCell>
        </TableRow>
      );
    }
    return tutorItems.map((row) => {
      const ui = statusToUI(row.status);
      const StatusIcon = statusStyle[ui].icon;
      const reward = Number(row.reward) || 0;
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
          <TableCell className="text-sm">{formatDate(row.date)}</TableCell>
          <TableCell>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${statusStyle[ui].pill}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {ui}
            </span>
          </TableCell>
          <TableCell>
            <span
              className={`text-sm font-semibold ${reward > 0 ? "text-green-600" : "text-gray-400"}`}
            >
              ₹{reward.toLocaleString()}
            </span>
          </TableCell>
        </TableRow>
      );
    });
  };

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
            Yoga Shikshak Referrals
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-4 h-4 z-10 pointer-events-none" />
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
                  <TableHead className="text-gray-700 font-bold">Status</TableHead>
                  <TableHead className="text-gray-700 font-bold">Reward</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderRows()}</TableBody>
            </Table>
          </div>

          {total > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} • {total} total
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
