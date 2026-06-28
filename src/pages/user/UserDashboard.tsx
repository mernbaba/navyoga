import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { BookOpen, Video, Calendar, Award, Clock, TrendingUp, Sparkles, GraduationCap, Gift, Users, Copy, Share2, Star, Crown, IndianRupee, Radio, CalendarDays, ChevronRight } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ImageWithFallback } from "../../components/Fallback/ImageWithFallback";
import { getStudentDashboard, type StudentDashboard } from "../../api/dashboard";
import { listMyLiveClasses } from "../../api/plans";
import type { LiveClass } from "../../api/types";
import {
  deriveStatus,
  selectUpcomingClasses,
  DIFFICULTY_COLOR,
} from "../../lib/liveClasses";
import { isWithinJoinWindow } from "../../lib/datetime";

const formatDiff = (n: number, suffix: string): string => {
  if (n === 0) return "No change";
  return `${n > 0 ? "+" : ""}${n} ${suffix}`;
};

const formatScheduled = (iso: string | null): { date: string; time: string } => {
  if (!iso) return { date: "TBD", time: "" };
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();
  const dateLabel = sameDay
    ? "Today"
    : isTomorrow
      ? "Tomorrow"
      : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return { date: dateLabel, time };
};

export function UserDashboard() {
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [enrolledModalOpen, setEnrolledModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    getStudentDashboard("STUDENT")
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

  // Source the "Upcoming Classes" widget from the same endpoint as the
  // "My Live Classes" page (all batches, with live/scheduled state) so both
  // surfaces always show the same active class. The dashboard endpoint's own
  // `upcomingClasses` is scoped to the enrolled batch only and carries no live
  // state, which made the two pages disagree.
  useEffect(() => {
    let cancelled = false;
    listMyLiveClasses()
      .then((res) => {
        if (!cancelled) setLiveClasses(res.classes);
      })
      .catch(() => {
        // Non-fatal: the widget simply shows "no upcoming classes".
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const m = data?.metrics;
    return [
      {
        title: "Enrolled Classes",
        onClick: () => setEnrolledModalOpen(true),
        value: (m?.enrolledClasses ?? 0).toLocaleString(),
        icon: BookOpen,
        color: "#ff691d",
        change: formatDiff(m?.enrolledChangeMonth ?? 0, "this month"),
        gradient: "from-orange-500 to-red-500",
      },
      {
        title: "Hours Completed",
        to: "/user/attendance",
        value: (m?.hoursCompleted ?? 0).toLocaleString(),
        icon: Clock,
        color: "#610981",
        change: formatDiff(m?.hoursChangeWeek ?? 0, "this week"),
        gradient: "from-purple-600 to-pink-600",
      },
      {
        title: "Recordings Watched",
        to: "/user/self-paced",
        value: (m?.recordingsWatched ?? 0).toLocaleString(),
        icon: Video,
        color: "#10b981",
        change: formatDiff(m?.recordingsChangeWeek ?? 0, "this week"),
        gradient: "from-green-500 to-teal-500",
      },
      {
        title: "Attendance Rate",
        to: "/user/attendance",
        value: `${m?.attendanceRate ?? 0}%`,
        icon: TrendingUp,
        color: "#f59e0b",
        change: formatDiff(m?.attendanceImprovement ?? 0, "vs prev month"),
        gradient: "from-yellow-500 to-orange-500",
      },
    ];
  }, [data]);

  const enrolledBreakdown = useMemo(() => {
    const b = data?.metrics.enrolledBreakdown;
    const rows = [
      { key: "live", label: "Yoga Live", to: "/user/classes", icon: BookOpen, color: "#ff691d", gradient: "from-orange-500 to-red-500", count: b?.live ?? 0 },
      { key: "selfPaced", label: "Yoga Self-Paced", to: "/user/self-paced", icon: GraduationCap, color: "#8b0fa8", gradient: "from-purple-500 to-purple-700", count: b?.selfPaced ?? 0 },
      { key: "yttLive", label: "YTT Live", to: "/user/ytt-live", icon: Radio, color: "#610981", gradient: "from-purple-600 to-pink-600", count: b?.yttLive ?? 0 },
      { key: "yttRecorded", label: "YTT Recorded", to: "/user/ytt-recorded", icon: Video, color: "#10b981", gradient: "from-green-500 to-teal-500", count: b?.yttRecorded ?? 0 },
      { key: "workshops", label: "Workshops", to: "/user/events", icon: Award, color: "#f59e0b", gradient: "from-yellow-500 to-orange-500", count: b?.workshops ?? 0 },
      { key: "events", label: "Events", to: "/user/events", icon: CalendarDays, color: "#0ea5e9", gradient: "from-sky-500 to-blue-600", count: b?.events ?? 0 },
    ];
    return rows.filter((r) => r.count > 0);
  }, [data]);

  const upcomingClasses = useMemo(
    () =>
      selectUpcomingClasses(liveClasses)
        .slice(0, 4)
        .map((c) => {
          const { date, time } = formatScheduled(c.scheduledAt);
          const isLive = deriveStatus(c) === "LIVE";
          return {
            id: c.id,
            name: c.title,
            instructor: c.tutor?.name ?? "Navyoga",
            date,
            time,
            duration: `${c.duration} min`,
            color: DIFFICULTY_COLOR[c.difficulty],
            isLive,
            joinable: isWithinJoinWindow({
              scheduledAt: c.scheduledAt,
              durationMinutes: c.duration,
              isLive,
            }),
          };
        }),
    [liveClasses],
  );

  const referralStats = data?.referralStats ?? {
    totalReferrals: 0,
    totalEarned: 0,
    referralCode: "",
    unlockedBadges: 0,
  };

  const REFERRAL_BADGE_TIERS = [1, 5, 10, 20, 50, 100];
  const unlockedReferralBadges = REFERRAL_BADGE_TIERS.filter(
    (t) => referralStats.totalReferrals >= t,
  ).length;

  const handleCopyReferralCode = () => {
    if (!referralStats.referralCode) return;
    navigator.clipboard.writeText(referralStats.referralCode);
    toast.success("Referral code copied to clipboard!");
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-linear-to-br from-gray-50 via-white to-orange-50/30">
      <div className="space-y-6">
 
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl shadow-2xl group cursor-pointer"
        >
          <Link to="/user/subscriptions">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1758599879927-f60878034fca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwd2VsbG5lc3MlMjBwcm9tb3Rpb24lMjBiYW5uZXJ8ZW58MXx8fHwxNzc0NTk0OTgzfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Navyoga Wellness Special Promotion"
              className="w-full h-48 md:h-64 lg:h-72 object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/40 to-transparent flex items-center">
              <div className="p-8 md:p-12">
                <Badge className="mb-4 bg-[#ff691d] text-white border-0 px-4 py-1.5">
                  🎉 LIMITED TIME OFFER
                </Badge>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                  Get 20% OFF<br />on Annual Plans!
                </h2>
                <Button
                  size="lg"
                  className="bg-white hover:bg-white/90 text-[#610981] font-bold shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Claim Offer Now
                </Button>
              </div>
            </div>
          </Link>
        </motion.div>
 
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const card = (
                <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer">
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
                    style={{ backgroundColor: metric.color }}
                  />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </CardTitle>
                    <div className={`p-3 rounded-xl bg-linear-to-br ${metric.gradient} shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      {metric.value}
                    </div>
                    <p className="text-xs font-medium mt-1" style={{ color: metric.color }}>{metric.change}</p>
                  </CardContent>
                </Card>
            );
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                {metric.onClick ? (
                  <button
                    type="button"
                    onClick={metric.onClick}
                    className="block w-full text-left"
                  >
                    {card}
                  </button>
                ) : (
                  <Link to={metric.to}>{card}</Link>
                )}
              </motion.div>
            );
          })}
        </div>
 
        <div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-bl from-[#ff691d]/10 to-transparent rounded-full blur-3xl" />
              <CardHeader className="flex flex-row items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-linear-to-br from-[#ff691d] to-[#ff8c4d] shadow-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl" style={{ color: '#ff691d' }}>Upcoming Classes</CardTitle>
                </div>
                <Link to="/user/classes">
                  <Button variant="ghost" size="sm" className="hover:bg-purple-100" style={{ color: '#610981' }}>View All →</Button>
                </Link>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-3">
                  {upcomingClasses.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      No upcoming classes scheduled.
                    </div>
                  ) : (
                    upcomingClasses.map((class_item, idx) => (
                      <motion.div
                        key={class_item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                        className="group relative overflow-hidden rounded-2xl p-4 border-2 border-gray-100 hover:border-purple-200 transition-all duration-300 bg-white hover:shadow-lg"
                      >
                        <div className="absolute inset-0 bg-linear-to-r from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className={`w-2 h-2 rounded-full ${class_item.isLive ? "bg-green-500 animate-pulse" : ""}`}
                                style={class_item.isLive ? undefined : { backgroundColor: class_item.color }}
                              />
                              <p className="font-semibold">{class_item.name}</p>
                              {class_item.isLive && (
                                <Badge className="bg-green-500 hover:bg-green-500/90 text-white text-[10px] px-1.5 py-0">
                                  LIVE
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {class_item.instructor} • {class_item.date}
                              {class_item.time ? ` at ${class_item.time}` : ""}
                            </p>
                            <Badge variant="secondary" className="text-xs mt-2" style={{ backgroundColor: `${class_item.color}20`, color: class_item.color }}>
                              {class_item.duration}
                            </Badge>
                          </div>
                          {class_item.joinable ? (
                            <Link to={`/user/class-session/${class_item.id}`}>
                              <Button
                                size="sm"
                                className={`text-white shadow-lg ${class_item.isLive ? "bg-linear-to-r from-[#ef4444] to-[#f97316]" : "bg-linear-to-r from-[#610981] to-[#8b0fa8]"}`}
                              >
                                {class_item.isLive ? (
                                  <>
                                    <Radio className="w-4 h-4 mr-1" /> Join Live
                                  </>
                                ) : (
                                  "Join"
                                )}
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              size="sm"
                              disabled
                              title="Available 15 minutes before class"
                              className="bg-linear-to-r from-[#610981] to-[#8b0fa8] text-white shadow-lg opacity-60"
                            >
                              Join
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
 
        </div>
 
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { to: '/user/classes', icon: BookOpen, title: 'Browse Classes', desc: 'Explore available courses', color: '#ff691d', gradient: 'from-orange-500 to-red-500' },
            { to: '/user/self-paced', icon: GraduationCap, title: 'Self-Paced', desc: 'Learn at your pace', color: '#8b0fa8', gradient: 'from-purple-500 to-purple-700' },
            { to: '/user/attendance', icon: Calendar, title: 'View Attendance', desc: 'Track your progress', color: '#10b981', gradient: 'from-green-500 to-teal-500' },
            { to: '/user/profile', icon: Award, title: 'My Profile', desc: 'Update your details', color: '#f59e0b', gradient: 'from-yellow-500 to-orange-500' }
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + idx * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Link to={action.to}>
                  <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                    <div className={`absolute inset-0 bg-linear-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <CardContent className="pt-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl bg-linear-to-br ${action.gradient} shadow-lg group-hover:shadow-xl transition-shadow`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-base mb-0.5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r" style={{ color: action.color }}>
                            {action.title}
                          </p>
                          <p className="text-sm text-muted-foreground">{action.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-bl from-[#ff691d]/10 via-[#610981]/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-linear-to-tr from-[#ffac96]/10 to-transparent rounded-full blur-3xl" />
            <CardHeader className="relative z-10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-linear-to-br from-[#ff691d] to-[#ff8c4d] shadow-lg">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl" style={{ color: '#ff691d' }}>Referral Program</CardTitle>
              </div>
              <Link to="/user/referrals">
                <Button variant="ghost" size="sm" className="hover:bg-purple-100" style={{ color: '#610981' }}>
                  View All →
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Referrals */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.0 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  className="relative p-5 rounded-2xl bg-linear-to-br from-white to-gray-50 border-2 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl"
                  style={{ borderColor: '#ff691d40' }}
                >
                  <div className="absolute inset-0 rounded-2xl opacity-10 blur-xl" style={{ backgroundColor: '#ff691d' }} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 rounded-xl shadow-lg bg-linear-to-br from-[#ff691d] to-[#ff8c4d]">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <Badge className="text-xs font-semibold" style={{ backgroundColor: '#ff691d20', color: '#ff691d' }}>
                        Active
                      </Badge>
                    </div>
                    <h4 className="font-bold text-2xl mb-1">{referralStats.totalReferrals}</h4>
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                  </div>
                </motion.div>
 
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  className="relative p-5 rounded-2xl bg-linear-to-br from-white to-gray-50 border-2 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl"
                  style={{ borderColor: '#61098140' }}
                >
                  <div className="absolute inset-0 rounded-2xl opacity-10 blur-xl" style={{ backgroundColor: '#610981' }} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 rounded-xl shadow-lg bg-linear-to-br from-[#610981] to-[#8b0fa8]">
                        <IndianRupee className="w-6 h-6 text-white" />
                      </div>
                      <Badge className="text-xs font-semibold" style={{ backgroundColor: '#61098120', color: '#610981' }}>
                        Earned
                      </Badge>
                    </div>
                    <h4 className="font-bold text-2xl mb-1 flex items-center gap-1">
                      <IndianRupee className="w-5 h-5" />
                      {referralStats.totalEarned}
                    </h4>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                  </div>
                </motion.div>
 
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  className="relative p-5 rounded-2xl bg-linear-to-br from-white to-gray-50 border-2 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl"
                  style={{ borderColor: '#f59e0b40' }}
                >
                  <div className="absolute inset-0 rounded-2xl opacity-10 blur-xl" style={{ backgroundColor: '#f59e0b' }} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 rounded-xl shadow-lg bg-linear-to-br from-yellow-400 to-orange-500">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <Badge className="text-xs font-semibold bg-yellow-100 text-yellow-700">
                        Unlocked
                      </Badge>
                    </div>
                    <h4 className="font-bold text-2xl mb-1">{unlockedReferralBadges}/{REFERRAL_BADGE_TIERS.length}</h4>
                    <p className="text-sm text-muted-foreground">Achievement Badges</p>
                  </div>
                </motion.div>
 
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  className="relative p-5 rounded-2xl bg-linear-to-br from-[#610981] to-[#8b0fa8] text-white shadow-lg cursor-pointer transition-all duration-300 hover:shadow-2xl"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 rounded-xl shadow-lg bg-white/20 backdrop-blur-sm">
                        <Share2 className="w-6 h-6 text-white" />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleCopyReferralCode}
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <h4 className="font-bold text-lg mb-1 font-mono">{referralStats.referralCode || "-"}</h4>
                    <p className="text-sm text-white/80">Your Referral Code</p>
                  </div>
                </motion.div>
              </div>
 
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="mt-4 p-6 rounded-2xl bg-linear-to-r from-[#ffac96]/20 to-[#ff691d]/20 border-2 border-[#ff691d]/30"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-linear-to-br from-[#ff691d] to-[#ff8c4d] shadow-lg">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg" style={{ color: '#ff691d' }}>
                        Share & Earn Rewards!
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Invite friends and earn ₹300 per referral + unlock achievement badges
                      </p>
                    </div>
                  </div>
                  <Link to="/user/referrals">
                    <Button
                      className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca] text-white shadow-lg gap-2"
                    >
                      <Gift className="w-4 h-4" />
                      View Referral Program
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={enrolledModalOpen} onOpenChange={setEnrolledModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: "#ff691d" }}>Enrolled Classes</DialogTitle>
            <DialogDescription>
              A breakdown of what you're currently enrolled in. Tap a category to view it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {enrolledBreakdown.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                You're not enrolled in anything yet.
              </div>
            ) : (
              enrolledBreakdown.map((row) => {
                const Icon = row.icon;
                return (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => {
                      setEnrolledModalOpen(false);
                      navigate(row.to);
                    }}
                    className="group flex w-full items-center justify-between rounded-2xl border-2 border-gray-100 p-4 text-left transition-all duration-200 hover:border-purple-200 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl bg-linear-to-br ${row.gradient} shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold">{row.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-sm font-bold"
                        style={{ backgroundColor: `${row.color}20`, color: row.color }}
                      >
                        {row.count}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}