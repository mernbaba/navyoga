import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

type TabKey = "user" | "tutor";
type RewardStatus = "earned" | "redeemed" | "pending";

interface ReferralData {
  code: string;
  link: string;
  totalReferred: number;
  active: number;
  pending: number;
  totalEarned: number;
  available: number;
  redeemed: number;
  list: ReferredItem[];
}

interface ReferredItem {
  id: number;
  name: string;
  email: string;
  tag: string;
  date: string;
  classes?: number;
  amount: number;
  status: RewardStatus;
}

const userReferralData: ReferralData = {
  code: "TUTOR-PRIYA-USER-2026",
  link: "https://navyoga.academy/join/TUTOR-PRIYA-USER-2026",
  totalReferred: 18,
  active: 14,
  pending: 3,
  totalEarned: 5400,
  available: 3600,
  redeemed: 1800,
  list: [
    {
      id: 1,
      name: "Rajesh Kumar",
      email: "rajesh.k@email.com",
      tag: "Monthly",
      date: "Mar 15, 2026",
      amount: 300,
      status: "earned",
    },
    {
      id: 2,
      name: "Anjali Mehta",
      email: "anjali.m@email.com",
      tag: "Quarterly",
      date: "Mar 10, 2026",
      amount: 300,
      status: "redeemed",
    },
    {
      id: 3,
      name: "Sanjay Patel",
      email: "sanjay.p@email.com",
      tag: "Monthly",
      date: "Apr 25, 2026",
      amount: 300,
      status: "pending",
    },
    {
      id: 4,
      name: "Meera Shah",
      email: "meera.s@email.com",
      tag: "Yearly",
      date: "Feb 28, 2026",
      amount: 300,
      status: "earned",
    },
  ],
};

const tutorReferralData: ReferralData = {
  code: "TUTOR-PRIYA-INSTRUCTOR-2026",
  link: "https://navyoga.academy/tutor-join/TUTOR-PRIYA-INSTRUCTOR-2026",
  totalReferred: 5,
  active: 4,
  pending: 1,
  totalEarned: 15000,
  available: 10000,
  redeemed: 5000,
  list: [
    {
      id: 1,
      name: "Amit Verma",
      email: "amit.v@navyoga.com",
      tag: "Hatha Yoga",
      date: "Jan 20, 2026",
      classes: 45,
      amount: 3000,
      status: "earned",
    },
    {
      id: 2,
      name: "Kavita Singh",
      email: "kavita.s@navyoga.com",
      tag: "Pranayama",
      date: "Feb 15, 2026",
      classes: 32,
      amount: 3000,
      status: "redeemed",
    },
    {
      id: 3,
      name: "Ravi Shankar",
      email: "ravi.s@navyoga.com",
      tag: "Meditation",
      date: "Apr 10, 2026",
      amount: 3000,
      status: "pending",
    },
  ],
};

const tagBadgeStyle = () =>
  "bg-[#ede4f5] text-[#610981] border-0 hover:bg-[#ede4f5]";

const statusBadgeStyle = (status: RewardStatus) => {
  switch (status) {
    case "earned":
      return "bg-[#ff691d] text-white border-0 hover:bg-[#ff691d]";
    case "redeemed":
      return "bg-[#10b981] text-white border-0 hover:bg-[#10b981]";
    case "pending":
      return "bg-gray-400 text-white border-0 hover:bg-gray-400";
  }
};

const statusLabel = (status: RewardStatus) =>
  status === "earned" ? "Earned" : status === "redeemed" ? "Redeemed" : "Pending";

export function TutorReferrals() {
  const [activeTab, setActiveTab] = useState<TabKey>("user");
  const data = activeTab === "user" ? userReferralData : tutorReferralData;

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  };

  const handleRedeem = () => {
    toast.success("Redemption request submitted");
  };

  const handleShare = (channel: "Email" | "WhatsApp") => {
    toast.success(`Sharing via ${channel}...`);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#610981] via-[#a020c8] to-[#ff691d] p-8 text-white shadow-2xl shadow-[#ffac96]/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center gap-4">
            <Gift className="w-9 h-9" strokeWidth={2.25} />
            <div>
              <h1 className="text-3xl font-bold mb-1">Referral Program</h1>
              <p className="text-white/85 text-base">
                Refer students and tutors to earn rewards
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
            Tutor Referrals
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">

          <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {activeTab === "user" ? "Total Students Referred" : "Total Tutors Referred"}
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
              <p className="text-xs text-muted-foreground">
                Available: ₹{data.available.toLocaleString("en-IN")}
              </p>
            </CardContent>
          </Card>

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
              Share Your {activeTab === "user" ? "User" : "Tutor"} Referral Code
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
              Referred {activeTab === "user" ? "Students" : "Tutors"} ({data.list.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            {data.list.map((item) => (
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
                      <Badge className={`text-xs ${tagBadgeStyle()}`}>
                        {item.tag}
                      </Badge>
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
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
