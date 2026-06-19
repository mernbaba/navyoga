import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Gift,
  Copy,
  Share2,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  Mail,
  MessageCircle,
  Send,
  IndianRupee,
  Sparkles,
  UserPlus,
  Clock,
  Star,
  Trophy,
  Medal,
  Crown,
  Zap,
  Target,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { getMyStudentReferrals } from "../../api/referrals";
import { StudentAvatar } from "../../components/student/StudentAvatar";
import type { MyReferralStudentItem, ReferralStatus } from "../../api/types";

interface ReferredUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: 'pending' | 'active' | 'completed';
  joinedDate: string;
  reward: number;
  rewardStatus: 'pending' | 'earned' | 'redeemed';
}

const PAGE_SIZE = 5;

const statusFromApi = (s: ReferralStatus): ReferredUser["status"] =>
  s === "ACTIVE" ? "active" : "pending";

// not from API: backend has no per-referral reward state separate from `status`
const rewardStatusFromApi = (s: ReferralStatus): ReferredUser["rewardStatus"] =>
  s === "ACTIVE" ? "earned" : "pending";

const formatJoinedDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const mapReferred = (item: MyReferralStudentItem): ReferredUser => ({
  id: item.id,
  name: item.name,
  email: item.email,
  avatar: item.avatar,
  status: statusFromApi(item.status),
  joinedDate: formatJoinedDate(item.date),
  reward: Number(item.reward) || 0,
  rewardStatus: rewardStatusFromApi(item.status),
});

interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: any;
  requirement: number;
  reward: number;
  unlocked: boolean;
  progress: number;
  color: string;
  bgColor: string;
  gradient: string;
}

// Frontend-only: badges derive their unlocked/progress from totalReferrals (no backend support).
const BADGE_DEFS: Omit<AchievementBadge, "unlocked" | "progress">[] = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Refer your first friend',
    icon: Target,
    requirement: 1,
    reward: 100,
    color: '#10b981',
    bgColor: 'bg-green-500',
    gradient: 'from-green-400 to-green-600',
  },
  {
    id: '2',
    name: 'Social Butterfly',
    description: 'Refer 5 friends',
    icon: UserPlus,
    requirement: 5,
    reward: 250,
    color: '#3b82f6',
    bgColor: 'bg-blue-500',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    id: '3',
    name: 'Rising Star',
    description: 'Refer 10 friends',
    icon: Star,
    requirement: 10,
    reward: 500,
    color: '#f59e0b',
    bgColor: 'bg-amber-500',
    gradient: 'from-amber-400 to-amber-600',
  },
  {
    id: '4',
    name: 'Top Performer',
    description: 'Refer 20 friends',
    icon: Medal,
    requirement: 20,
    reward: 1000,
    color: '#8b5cf6',
    bgColor: 'bg-purple-500',
    gradient: 'from-purple-400 to-purple-600',
  },
  {
    id: '5',
    name: 'Champion',
    description: 'Refer 50 friends',
    icon: Trophy,
    requirement: 50,
    reward: 2500,
    color: '#ec4899',
    bgColor: 'bg-pink-500',
    gradient: 'from-pink-400 to-pink-600',
  },
  {
    id: '6',
    name: 'Legend',
    description: 'Refer 100 friends',
    icon: Crown,
    requirement: 100,
    reward: 5000,
    color: '#eab308',
    bgColor: 'bg-yellow-500',
    gradient: 'from-yellow-400 to-yellow-600',
  },
];

export function UserReferrals() {
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);

  const [page, setPage] = useState(1);
  const [totalReferred, setTotalReferred] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    pendingReferrals: 0,
    totalEarned: 0,
    // not from API: backend returns only totalEarned (no available/redeemed split)
    availableBalance: 0,
    redeemedBalance: 0,
  });

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getMyStudentReferrals("STUDENT", { page, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        const code = res.referralCode ?? "";
        setReferralCode(code);
        setReferralLink(code ? `${window.location.origin}/register?ref=${code}` : "");
        setReferredUsers(res.items.map(mapReferred));
        setTotalReferred(res.total);
        setTotalPages(Math.max(1, res.totalPages));
        const totalEarned = Number(res.overview.totalEarned) || 0;
        setReferralStats({
          totalReferrals: res.overview.totalReferrals,
          activeReferrals: res.overview.active,
          pendingReferrals: res.overview.pending,
          totalEarned,
          // not from API: derived placeholder — backend has no available/redeemed split
          availableBalance: totalEarned,
          redeemedBalance: 0,
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load referrals.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page]);

  const achievementBadges: AchievementBadge[] = useMemo(() => {
    const total = referralStats.totalReferrals;
    return BADGE_DEFS.map((b) => ({
      ...b,
      unlocked: total >= b.requirement,
      progress: Math.min(100, Math.round((total / b.requirement) * 100)),
    }));
  }, [referralStats.totalReferrals]);

  const handleCopyCode = () => {
    if (!referralCode) {
      toast.error("Referral code not available yet");
      return;
    }
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied to clipboard!');
  };

  const handleCopyLink = () => {
    if (!referralLink) {
      toast.error("Referral link not available yet");
      return;
    }
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const handleShareLink = async () => {
    if (!referralLink) {
      toast.error("Referral link not available yet");
      return;
    }
    const shareData = {
      title: "Join me on Navyoga",
      text: "Join me on Navyoga and start your yoga journey!",
      url: referralLink,
    };
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        toast.error("Unable to open share dialog");
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied to clipboard!");
    } catch {
      toast.error("Sharing not supported on this device");
    }
  };

  // Frontend-only: share is a UI-only mailto/wa.me action
  const handleShare = (platform: string) => {
    toast.success(`Opening ${platform} to share...`);
  };

  // not from API: no redemption endpoint exists yet
  const handleRedeem = () => {
    toast.info('Redemption flow coming soon');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRewardStatusColor = (status: string) => {
    switch (status) {
      case 'earned':
        return 'bg-green-100 text-green-700';
      case 'redeemed':
        return 'bg-purple-100 text-purple-700';
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-linear-to-br from-[#610981] to-[#8b0fa8] shadow-lg">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#ff691d' }}>
              Referral Program
            </h1>
            <p className="text-muted-foreground mt-1">
              Invite friends and earn rewards together
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-2 border-[#ff691d]/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff691d]/10 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  <p className="text-3xl font-bold mt-2">{referralStats.totalReferrals}</p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: '#ff691d20' }}>
                  <Users className="w-6 h-6" style={{ color: '#ff691d' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-2 border-green-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Referrals</p>
                  <p className="text-3xl font-bold mt-2">{referralStats.activeReferrals}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-2 border-[#610981]/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#610981]/10 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-3xl font-bold mt-2 flex items-center gap-1">
                    <IndianRupee className="w-6 h-6" />
                    {referralStats.totalEarned}
                  </p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: '#61098120' }}>
                  <TrendingUp className="w-6 h-6" style={{ color: '#610981' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Frontend-only: backend has no available-balance field — mirrors totalEarned */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="relative overflow-hidden border-2 border-purple-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-3xl font-bold mt-2 flex items-center gap-1">
                    <IndianRupee className="w-6 h-6" />
                    {referralStats.availableBalance}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Frontend-only: badges unlock based on totalReferrals; locked badges render in grey */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-linear-to-br from-[#ff691d]/5 to-[#610981]/5 rounded-full blur-3xl" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-6 h-6" style={{ color: '#ff691d' }} />
                  <span style={{ color: '#ff691d' }}>Achievement Badges</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Unlock special rewards by reaching referral milestones
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                <Zap className="w-3 h-3 mr-1" />
                {achievementBadges.filter(b => b.unlocked).length}/{achievementBadges.length} Unlocked
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {achievementBadges.map((badge, index) => {
                const IconComponent = badge.icon;
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="relative"
                  >
                    <Card className={`relative overflow-hidden ${badge.unlocked ? 'border-2' : 'opacity-70'}`} style={{ borderColor: badge.unlocked ? badge.color + '40' : undefined }}>
                      <div className={`absolute top-0 right-0 w-32 h-32 ${badge.unlocked ? 'opacity-10' : 'opacity-5'} rounded-full blur-2xl ${badge.unlocked ? badge.bgColor : 'bg-gray-400'}`} />
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${badge.unlocked ? `bg-linear-to-br ${badge.gradient}` : 'bg-gray-200'} shadow-lg shrink-0 relative`}>
                            {badge.unlocked && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <IconComponent className={`w-8 h-8 ${badge.unlocked ? 'text-white' : 'text-gray-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-base mb-1 ${badge.unlocked ? '' : 'text-gray-500'}`}>{badge.name}</h4>
                            <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {badge.progress}% Complete
                                </span>
                                <span className="font-medium" style={{ color: badge.unlocked ? badge.color : '#9ca3af' }}>
                                  {Math.min(referralStats.totalReferrals, badge.requirement)}/{badge.requirement}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${badge.progress}%` }}
                                  transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                                  className={`h-full ${badge.unlocked ? `bg-linear-to-r ${badge.gradient}` : 'bg-gray-300'}`}
                                />
                              </div>
                            </div>

                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="lg:col-span-2 space-y-6">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffac96]/10 rounded-full blur-3xl" />
              <CardHeader>
                <CardTitle style={{ color: '#ff691d' }}>Share Your Referral Code</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Share your unique code with friends and family
                </p>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Referral Code</label>
                  <div className="flex gap-2">
                    <Input
                      value={referralCode}
                      readOnly
                      className="font-mono text-lg font-semibold"
                    />
                    <Button
                      onClick={handleCopyCode}
                      style={{ backgroundColor: '#610981', color: 'white' }}
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Referral Link</label>
                  <div className="flex gap-2">
                    <Input
                      value={referralLink}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </Button>
                  </div>
                </div>

                {/* <div className="pt-4">
                  <p className="text-sm font-medium mb-3">Share on Social Media</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleShare('WhatsApp')}
                      className="flex-1 min-w-[140px] bg-green-500 hover:bg-green-600 text-white gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                    <Button
                      onClick={() => handleShare('Email')}
                      className="flex-1 min-w-[140px] bg-blue-500 hover:bg-blue-600 text-white gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </Button>
                    <Button
                      onClick={() => handleShare('Facebook')}
                      className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Facebook
                    </Button>
                    <Button
                      onClick={() => handleShare('Twitter')}
                      className="flex-1 min-w-[140px] bg-sky-500 hover:bg-sky-600 text-white gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Twitter
                    </Button>
                  </div>
                </div> */}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle style={{ color: '#ff691d' }}>Your Referrals</CardTitle>
                  <Badge variant="secondary">{totalReferred} Total</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {referredUsers.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      {isLoading ? "Loading..." : "No referrals yet"}
                    </div>
                  ) : (
                    referredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <StudentAvatar avatar={user.avatar} name={user.name} className="size-10" />
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              Joined {user.joinedDate}
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                          <div className="flex items-center gap-2 justify-end">
                            <IndianRupee className="w-4 h-4" />
                            <span className="font-semibold">{user.reward}</span>
                            <Badge className={getRewardStatusColor(user.rewardStatus)} variant="outline">
                              {user.rewardStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {totalReferred > PAGE_SIZE && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Page {page} of {totalPages} • {totalReferred} total
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1 || isLoading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages || isLoading}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
          </motion.div>
        </div>

        <div className="space-y-6">

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#610981]/10 rounded-full blur-2xl" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: '#ff691d' }} />
                  <span style={{ color: '#ff691d' }}>How It Works</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-[#ff691d] text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Share Your Code</p>
                    <p className="text-sm text-muted-foreground">
                      Send your unique referral code to friends
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-[#610981] text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Friend Joins</p>
                    <p className="text-sm text-muted-foreground">
                      They sign up using your referral code
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Get Rewarded</p>
                    <p className="text-sm text-muted-foreground">
                      Earn ₹300 when they subscribe
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">They Get Discount</p>
                    <p className="text-sm text-muted-foreground">
                      Your friend gets 10% off their first month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="relative overflow-hidden border-2 border-[#ffac96]/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffac96]/20 rounded-full blur-2xl" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" style={{ color: '#610981' }} />
                  <span style={{ color: '#610981' }}>Reward Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Frontend-only: backend has no available-balance field — mirrors totalEarned */}
                <div className="p-4 rounded-lg bg-linear-to-br from-[#610981]/10 to-[#ff691d]/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Available Balance</span>
                    <Star className="w-4 h-4 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold flex items-center gap-1" style={{ color: '#610981' }}>
                    <IndianRupee className="w-7 h-7" />
                    {referralStats.availableBalance}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Earned</span>
                    <span className="font-semibold flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" />
                      {referralStats.totalEarned}
                    </span>
                  </div>
                  {/* Frontend-only: backend has no redeemed amount */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Redeemed</span>
                    <span className="font-semibold flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" />
                      {referralStats.redeemedBalance}
                    </span>
                  </div>
                  {/* Frontend-only: pending amount uses hardcoded ₹300 reward, not from backend */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-semibold flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" />
                      {referralStats.pendingReferrals * 300}
                    </span>
                  </div>
                </div>

                {/* Frontend-only: no redemption endpoint exists; button is a stub */}
                <Button
                  onClick={handleRedeem}
                  className="w-full gap-2"
                  style={{ backgroundColor: '#610981', color: 'white' }}
                  disabled={referralStats.availableBalance === 0}
                >
                  <Send className="w-4 h-4" />
                  Redeem Rewards
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Rewards can be redeemed for subscription discounts or transferred to your account
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="relative overflow-hidden bg-linear-to-br from-[#610981] to-[#8b0fa8] text-white border-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <CardContent className="p-6 relative">
                <UserPlus className="w-12 h-12 mb-3 opacity-80" />
                <h3 className="text-xl font-bold mb-2">Invite More Friends!</h3>
                <p className="text-sm opacity-90 mb-4">
                  The more you share, the more you earn. No limits on referrals!
                </p>
                <Button
                  onClick={handleShareLink}
                  className="w-full bg-white text-[#610981] hover:bg-gray-100 gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share Now
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
