import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Gift,
  Copy,
  Share2,
  Users,
  GraduationCap,
  Trophy,
  IndianRupee,
  Mail,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMyTutorTutorReferrals,
  getMyTutorUserReferrals,
} from "../../api/referrals";
import type {
  MyReferralOverview,
  MyReferralStudentItem,
  MyReferralTutorItem,
  ReferralStatus,
} from "../../api/types";

type TabKey = "user" | "tutor";
// type RewardStatus = "earned" | "redeemed" | "pending"; // not from API: API only returns ACTIVE | PENDING (no redeemed concept)
type RewardStatus = "earned" | "pending";

interface ReferralData {
  code: string;
  link: string;
  totalReferred: number;
  active: number;
  pending: number;
  totalEarned: number;
  // Frontend-only: backend returns only totalEarned, no available/redeemed split
  available: number;
  redeemed: number;
  list: ReferredItem[];
  total: number;
  totalPages: number;
}

interface ReferredItem {
  id: string;
  name: string;
  email: string;
  tag: string;
  date: string;
  classes?: number;
  amount: number;
  status: RewardStatus;
}

const emptyReferralData: ReferralData = {
  code: "",
  link: "",
  totalReferred: 0,
  active: 0,
  pending: 0,
  totalEarned: 0,
  available: 0,
  redeemed: 0,
  list: [],
  total: 0,
  totalPages: 1,
};

const PAGE_SIZE = 5;

const buildLink = (code: string) => (code ? `${window.location.origin}/register?ref=${code}` : "");

const tagBadgeStyle = () =>
  "bg-[#ede4f5] text-[#610981] border-0 hover:bg-[#ede4f5]";

const statusBadgeStyle = (status: RewardStatus) => {
  switch (status) {
    case "earned":
      return "bg-[#ff691d] text-white border-0 hover:bg-[#ff691d]";
    // case "redeemed":
    //   return "bg-[#10b981] text-white border-0 hover:bg-[#10b981]"; // not from API
    case "pending":
      return "bg-gray-400 text-white border-0 hover:bg-gray-400";
  }
};

const statusLabel = (status: RewardStatus) =>
  status === "earned" ? "Earned" : "Pending";

const statusFromApi = (s: ReferralStatus): RewardStatus =>
  s === "ACTIVE" ? "earned" : "pending";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const mapUserItem = (item: MyReferralStudentItem): ReferredItem => ({
  id: item.id,
  name: item.name,
  email: item.email,
  tag: "-", // not from API: backend `/me/users` item has no subscription period field
  date: formatDate(item.date),
  amount: Number(item.reward) || 0,
  status: statusFromApi(item.status),
});

const mapTutorItem = (item: MyReferralTutorItem): ReferredItem => ({
  id: item.id,
  name: item.name,
  email: item.email,
  tag: item.specializations?.[0] ?? "-",
  date: formatDate(item.date),
  classes: item.classes,
  amount: Number(item.reward) || 0,
  status: statusFromApi(item.status),
});

export function TutorReferrals() {
  const [activeTab, setActiveTab] = useState<TabKey>("user");
  const [userData, setUserData] = useState<ReferralData>(emptyReferralData);
  const [tutorData, setTutorData] = useState<ReferralData>(emptyReferralData);
  const [userPage, setUserPage] = useState(1);
  const [tutorPage, setTutorPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const data = activeTab === "user" ? userData : tutorData;
  const page = activeTab === "user" ? userPage : tutorPage;
  const setPage = (next: number) => {
    if (activeTab === "user") setUserPage(next);
    else setTutorPage(next);
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const fetcher =
      activeTab === "user"
        ? getMyTutorUserReferrals("TUTOR", { page, limit: PAGE_SIZE })
        : getMyTutorTutorReferrals("TUTOR", { page, limit: PAGE_SIZE });

    fetcher
      .then((res) => {
        if (cancelled) return;
        const overview: MyReferralOverview = res.overview;
        const code = res.referralCode ?? "";
        const totalEarned = Number(overview.totalEarned) || 0;
        const next: ReferralData = {
          code,
          link: buildLink(code),
          totalReferred: overview.totalReferred,
          active: overview.active,
          pending: overview.pending,
          totalEarned,
          // Frontend-only: backend has no available/redeemed split
          available: totalEarned,
          redeemed: 0,
          list:
            activeTab === "user"
              ? (res.items as MyReferralStudentItem[]).map(mapUserItem)
              : (res.items as MyReferralTutorItem[]).map(mapTutorItem),
          total: res.total,
          totalPages: Math.max(1, res.totalPages),
        };
        if (activeTab === "user") setUserData(next);
        else setTutorData(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load referrals.");
      })
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [activeTab, page]);

  const handleCopy = (value: string, label: string) => {
    if (!value) {
      toast.error(`${label} not available yet`);
      return;
    }
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  };

  // not from API: no redemption endpoint exists yet
  const handleRedeem = () => {
    toast.info("Redemption flow coming soon");
  };

  // not from API: share is a frontend-only mailto/wa.me action
  const handleShare = (channel: "Email" | "WhatsApp") => {
    toast.success(`Sharing via ${channel}...`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">

        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#610981] via-[#a020c8] to-[#ff691d] p-6 sm:p-8 text-white shadow-2xl shadow-[#ffac96]/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center gap-4">
            <Gift className="w-9 h-9 shrink-0" strokeWidth={2.25} />
            <div>
              <h1 className="text-3xl font-bold mb-1">Referral Program</h1>
              <p className="text-white/85 text-base">
                Refer sādhakas and yoga shikshaks to earn rewards
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-gray-100/70 border border-gray-200">
          <button
            onClick={() => setActiveTab("user")}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "user"
                ? "bg-white text-[#1f2937] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users className="w-4 h-4" />
            User Referrals
          </button>
          <button
            onClick={() => setActiveTab("tutor")}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "tutor"
                ? "bg-white text-[#1f2937] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Yoga Shikshak Referrals
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">

          <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {activeTab === "user" ? "Total Sādhakas Referred" : "Total Yoga Shikshaks Referred"}
              </CardTitle>
              {activeTab === "user" ? (
                <Users className="w-5 h-5" style={{ color: "#ff691d" }} strokeWidth={2.25} />
              ) : (
                <GraduationCap className="w-5 h-5" style={{ color: "#ff691d" }} strokeWidth={2.25} />
              )}
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-2" style={{ color: "#ff691d" }}>
                {data.totalReferred}
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/15 border-0 text-xs">
                  {data.active} Active
                </Badge>
                <Badge className="bg-gray-200 text-gray-600 hover:bg-gray-200 border-0 text-xs">
                  {data.pending} Pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Earned
              </CardTitle>
              <IndianRupee className="w-5 h-5" style={{ color: "#10b981" }} strokeWidth={2.25} />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1" style={{ color: "#10b981" }}>
                ₹{data.totalEarned.toLocaleString("en-IN")}
              </div>
              {/* Frontend-only: backend has no available split, mirrors totalEarned */}
              <p className="text-xs text-muted-foreground">
                Available: ₹{data.available.toLocaleString("en-IN")}
              </p>
            </CardContent>
          </Card>

          {/* Frontend-only: no redemption endpoint exists; card + button are stubs */}
          <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Redeemed
              </CardTitle>
              <Trophy className="w-5 h-5" style={{ color: "#a855f7" }} strokeWidth={2.25} />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-2" style={{ color: "#a855f7" }}>
                ₹{data.redeemed.toLocaleString("en-IN")}
              </div>
              <Button
                onClick={handleRedeem}
                size="sm"
                className="bg-[#610981] hover:bg-[#7a0a9f] text-white h-8 px-4 rounded-lg"
              >
                Redeem Now
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="relative overflow-hidden border-0 shadow-md">
          <CardHeader className="relative z-10">
            <CardTitle
              className="flex items-center gap-2 text-base"
              style={{ color: "#ff691d" }}
            >
              <Share2 className="w-5 h-5" />
              Share Your {activeTab === "user" ? "User" : "Yoga Shikshak"} Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 space-y-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Referral Code
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={data.code}
                  readOnly
                  className="flex-1 bg-gray-50 border-gray-200 font-mono text-sm"
                />
                <Button
                  onClick={() => handleCopy(data.code, "Referral code")}
                  size="icon"
                  className="bg-[#610981] hover:bg-[#7a0a9f] text-white shrink-0 h-10 w-10 rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Referral Link
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={data.link}
                  readOnly
                  className="flex-1 bg-gray-50 border-gray-200 text-sm"
                />
                <Button
                  onClick={() => handleCopy(data.link, "Referral link")}
                  size="icon"
                  className="bg-[#610981] hover:bg-[#7a0a9f] text-white shrink-0 h-10 w-10 rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Share via:
              </p>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleShare("Email")}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  onClick={() => handleShare("WhatsApp")}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md">
          <CardHeader className="relative z-10">
            <CardTitle
              className="text-base"
              style={{ color: "#ff691d" }}
            >
              Referred {activeTab === "user" ? "Sādhakas" : "Yoga Shikshaks"} ({data.total})
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            {data.list.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                {isLoading ? "Loading..." : `No referred ${activeTab === "user" ? "sādhakas" : "yoga shikshaks"} yet`}
              </div>
            ) : (
              data.list.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-border/60 rounded-xl hover:shadow-md hover:border-[#ffac96]/60 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background:
                          activeTab === "user"
                            ? "radial-gradient(circle at top right, #ffac9655 0%, #ffd8c2 40%, #fff0e6 100%)"
                            : "radial-gradient(circle at top right, #c9a8e0 0%, #ddc4ec 40%, #f0e4f7 100%)",
                      }}
                    >
                      {activeTab === "user" ? (
                        <Users className="w-5 h-5" style={{ color: "#ff691d" }} strokeWidth={2.25} />
                      ) : (
                        <GraduationCap className="w-5 h-5" style={{ color: "#610981" }} strokeWidth={2.25} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.email}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {/* not from API: `/me/users` has no subscription period field; tutor tab uses item.specializations[0] */}
                        {/* <Badge className={`text-xs ${tagBadgeStyle()}`}>
                          {item.tag}
                        </Badge> */}
                        <span className="text-xs text-muted-foreground">
                          {item.date}
                          {item.classes !== undefined ? ` • ${item.classes} classes` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#10b981" }}>
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>₹{item.amount}</span>
                    </div>
                    <Badge className={`text-xs ${statusBadgeStyle(item.status)}`}>
                      {statusLabel(item.status)}
                    </Badge>
                  </div>
                </div>
              ))
            )}

            {data.total > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-3 mt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {data.totalPages} • {data.total} total
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isLoading}
                    onClick={() => setPage(Math.max(1, page - 1))}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.totalPages || isLoading}
                    onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
