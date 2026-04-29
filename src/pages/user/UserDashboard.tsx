import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { BookOpen, Video, Calendar, Award, Clock, TrendingUp, Sparkles, Target, Trophy, Flame, GraduationCap, Gift, Users, Copy, Share2, Star, Crown, IndianRupee } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Link } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ImageWithFallback } from "../../components/Fallback/ImageWithFallback";

export function UserDashboard() {
  const metrics = [
    { title: 'Enrolled Classes', value: '8', icon: BookOpen, color: '#ff691d', change: '+2 this month', gradient: 'from-orange-500 to-red-500' },
    { title: 'Hours Completed', value: '124', icon: Clock, color: '#610981', change: '+18 this week', gradient: 'from-purple-600 to-pink-600' },
    { title: 'Recordings Watched', value: '45', icon: Video, color: '#10b981', change: '+8 this week', gradient: 'from-green-500 to-teal-500' },
    { title: 'Attendance Rate', value: '92%', icon: TrendingUp, color: '#f59e0b', change: '+5% improvement', gradient: 'from-yellow-500 to-orange-500' },
  ];

  const upcomingClasses = [
    { id: 1, name: 'Advanced Hatha Yoga', instructor: 'Priya Sharma', date: 'Today', time: '6:00 PM', status: 'upcoming', duration: '60 min', color: '#ff691d' },
    { id: 2, name: 'Pranayama Basics', instructor: 'Rahul Kumar', date: 'Tomorrow', time: '7:00 AM', status: 'upcoming', duration: '45 min', color: '#610981' },
    { id: 3, name: 'Meditation & Mindfulness', instructor: 'Anita Verma', date: 'Mar 12', time: '8:00 AM', status: 'upcoming', duration: '30 min', color: '#10b981' },
    { id: 4, name: 'Power Yoga Flow', instructor: 'Vikram Singh', date: 'Mar 13', time: '6:30 PM', status: 'upcoming', duration: '75 min', color: '#f59e0b' },
  ];

  const recentRecordings = [
    { id: 1, title: 'Introduction to Ashtanga', instructor: 'Priya Sharma', duration: '45:30', date: 'Mar 8', views: 234, thumbnail: 'recording' },
    { id: 2, title: 'Breathing Techniques', instructor: 'Rahul Kumar', duration: '30:15', date: 'Mar 7', views: 189, thumbnail: 'recording' },
    { id: 3, title: 'Morning Stretch Routine', instructor: 'Anita Verma', duration: '25:00', date: 'Mar 6', views: 312, thumbnail: 'recording' },
  ];

  const achievements = [
    { id: 1, title: '30-Day Streak', description: 'Attended classes for 30 consecutive days', icon: Flame, color: '#ff691d', earned: true },
    { id: 2, title: 'Early Bird', description: 'Attended 10 morning classes', icon: Target, color: '#10b981', earned: true },
    { id: 3, title: 'Meditation Master', description: 'Completed 20 meditation sessions', icon: Trophy, color: '#610981', earned: false },
  ];
 
  const referralStats = {
    totalReferrals: 12,
    totalEarned: 3600,
    referralCode: "NAVYOGA-SARAH-2026",
    unlockedBadges: 3,
  };

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(referralStats.referralCode);
    toast.success('Referral code copied to clipboard!');
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
      <div className="space-y-6">
 
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl shadow-2xl group cursor-pointer"
        >
          <Link to="/user/payments">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1758599879927-f60878034fca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwd2VsbG5lc3MlMjBwcm9tb3Rpb24lMjBiYW5uZXJ8ZW58MXx8fHwxNzc0NTk0OTgzfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="NavYoga Academy Special Promotion"
              className="w-full h-48 md:h-64 lg:h-72 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent flex items-center">
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
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
                    style={{ backgroundColor: metric.color }}
                  />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </CardTitle>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      {metric.value}
                    </div>
                    <p className="text-xs font-medium mt-1" style={{ color: metric.color }}>{metric.change}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
 
        <div className="grid gap-6 lg:grid-cols-2">
 
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#ff691d]/10 to-transparent rounded-full blur-3xl" />
              <CardHeader className="flex flex-row items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#ff691d] to-[#ff8c4d] shadow-lg">
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
                  {upcomingClasses.map((class_item, idx) => (
                    <motion.div 
                      key={class_item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                      className="group relative overflow-hidden rounded-2xl p-4 border-2 border-gray-100 hover:border-purple-200 transition-all duration-300 bg-white hover:shadow-lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: class_item.color }} />
                            <p className="font-semibold">{class_item.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {class_item.instructor} • {class_item.date} at {class_item.time}
                          </p>
                          <Badge variant="secondary" className="text-xs mt-2" style={{ backgroundColor: `${class_item.color}20`, color: class_item.color }}>
                            {class_item.duration}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca] text-white shadow-lg"
                        >
                          Join
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
 
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#610981]/10 to-transparent rounded-full blur-3xl" />
              <CardHeader className="flex flex-row items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#610981] to-[#8b0fa8] shadow-lg">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl" style={{ color: '#ff691d' }}>Recent Recordings</CardTitle>
                </div>
                <Link to="/user/recordings">
                  <Button variant="ghost" size="sm" className="hover:bg-purple-100" style={{ color: '#610981' }}>View All →</Button>
                </Link>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-3">
                  {recentRecordings.map((recording, idx) => (
                    <motion.div 
                      key={recording.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                      className="group flex items-center gap-4 p-3 rounded-2xl border-2 border-gray-100 hover:border-purple-200 transition-all duration-300 cursor-pointer bg-white hover:shadow-lg"
                    >
                      <div className="relative">
                        <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#610981] to-[#8b0fa8] shadow-lg group-hover:shadow-xl transition-shadow">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate group-hover:text-purple-700 transition-colors">{recording.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {recording.instructor} • {recording.duration}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {recording.views} views
                          </Badge>
                          <span className="text-xs text-muted-foreground">{recording.date}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#ffac96]/20 to-transparent rounded-full blur-3xl" />
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl" style={{ color: '#ff691d' }}>Your Achievements</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid gap-4 md:grid-cols-3">
                {achievements.map((achievement, idx) => {
                  const Icon = achievement.icon;
                  return (
                    <motion.div 
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + idx * 0.1 }}
                      whileHover={{ scale: achievement.earned ? 1.05 : 1, transition: { duration: 0.2 } }}
                      className={`relative p-6 rounded-2xl transition-all duration-300 ${ 
                        achievement.earned 
                          ? 'bg-gradient-to-br from-white to-gray-50 border-2 shadow-xl cursor-pointer' 
                          : 'bg-gray-50 border-2 border-dashed border-gray-200 opacity-60'
                      }`}
                      style={{ borderColor: achievement.earned ? achievement.color : undefined }}
                    >
                      {achievement.earned && (
                        <div 
                          className="absolute inset-0 rounded-2xl opacity-10 blur-xl"
                          style={{ backgroundColor: achievement.color }}
                        />
                      )}
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className={`p-3 rounded-xl shadow-lg ${achievement.earned ? 'bg-gradient-to-br' : 'bg-gray-200'}`}
                            style={achievement.earned ? { background: `linear-gradient(135deg, ${achievement.color}, ${achievement.color}dd)` } : {}}
                          >
                            <Icon className={`w-6 h-6 ${achievement.earned ? 'text-white' : 'text-gray-400'}`} />
                          </div>
                          {achievement.earned && (
                            <Badge className="text-xs font-semibold" style={{ backgroundColor: `${achievement.color}20`, color: achievement.color }}>
                              ✓ Earned
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-bold text-base mb-1.5">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{achievement.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
 
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[
            { to: '/user/classes', icon: BookOpen, title: 'Browse Classes', desc: 'Explore available courses', color: '#ff691d', gradient: 'from-orange-500 to-red-500' },
            { to: '/user/self-paced', icon: GraduationCap, title: 'Self-Paced', desc: 'Learn at your pace', color: '#8b0fa8', gradient: 'from-purple-500 to-purple-700' },
            { to: '/user/recordings', icon: Video, title: 'Watch Recordings', desc: 'Catch up on sessions', color: '#610981', gradient: 'from-purple-600 to-pink-600' },
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
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <CardContent className="pt-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${action.gradient} shadow-lg group-hover:shadow-xl transition-shadow`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-base mb-0.5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r" style={{ color: action.color }}>
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
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#ff691d]/10 via-[#610981]/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#ffac96]/10 to-transparent rounded-full blur-3xl" />
            <CardHeader className="relative z-10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#ff691d] to-[#ff8c4d] shadow-lg">
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
                  className="relative p-5 rounded-2xl bg-gradient-to-br from-white to-gray-50 border-2 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl"
                  style={{ borderColor: '#ff691d40' }}
                >
                  <div className="absolute inset-0 rounded-2xl opacity-10 blur-xl" style={{ backgroundColor: '#ff691d' }} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-[#ff691d] to-[#ff8c4d]">
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
                  className="relative p-5 rounded-2xl bg-gradient-to-br from-white to-gray-50 border-2 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl"
                  style={{ borderColor: '#61098140' }}
                >
                  <div className="absolute inset-0 rounded-2xl opacity-10 blur-xl" style={{ backgroundColor: '#610981' }} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-[#610981] to-[#8b0fa8]">
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
                  className="relative p-5 rounded-2xl bg-gradient-to-br from-white to-gray-50 border-2 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl"
                  style={{ borderColor: '#f59e0b40' }}
                >
                  <div className="absolute inset-0 rounded-2xl opacity-10 blur-xl" style={{ backgroundColor: '#f59e0b' }} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-yellow-400 to-orange-500">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <Badge className="text-xs font-semibold bg-yellow-100 text-yellow-700">
                        Unlocked
                      </Badge>
                    </div>
                    <h4 className="font-bold text-2xl mb-1">{referralStats.unlockedBadges}/6</h4>
                    <p className="text-sm text-muted-foreground">Achievement Badges</p>
                  </div>
                </motion.div>
 
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  className="relative p-5 rounded-2xl bg-gradient-to-br from-[#610981] to-[#8b0fa8] text-white shadow-lg cursor-pointer transition-all duration-300 hover:shadow-2xl"
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
                    <h4 className="font-bold text-lg mb-1 font-mono">{referralStats.referralCode}</h4>
                    <p className="text-sm text-white/80">Your Referral Code</p>
                  </div>
                </motion.div>
              </div>
 
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="mt-4 p-6 rounded-2xl bg-gradient-to-r from-[#ffac96]/20 to-[#ff691d]/20 border-2 border-[#ff691d]/30"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#ff691d] to-[#ff8c4d] shadow-lg">
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
                      className="bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca] text-white shadow-lg gap-2"
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
    </div>
  );
}