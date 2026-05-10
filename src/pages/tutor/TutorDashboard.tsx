import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Users, Calendar, Clock, TrendingUp, CheckCircle, AlertCircle, Sparkles, Play, ClipboardCheck, Gift, ArrowRight, Award, GraduationCap, IndianRupee } from "lucide-react";
import { classes, students } from "../../data/mockData";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const attendanceData = [
  { month: 'Oct', rate: 88 },
  { month: 'Nov', rate: 92 },
  { month: 'Dec', rate: 85 },
  { month: 'Jan', rate: 94 },
  { month: 'Feb', rate: 91 },
  { month: 'Mar', rate: 95 },
];

const classPerformanceData = [
  { name: 'Hatha Yoga', students: 15 },
  { name: 'Power Yoga', students: 12 },
  { name: 'Meditation', students: 20 },
];

export function TutorDashboard() {
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<string | null>(null);
 
  const tutorName = "Priya Sharma";
  const tutorClasses = classes.slice(0, 5);
  
  const totalStudents = tutorClasses.reduce((sum, cls) => sum + cls.enrolledStudents.length, 0);
  const upcomingClasses = tutorClasses.filter(cls => cls.status === 'active').length;
  const completedClasses = 24;  
  const avgAttendance = 92;  

  const stats = [
    { name: "Total Students", value: totalStudents, icon: Users, color: '#ff691d' },
    { name: "Upcoming Classes", value: upcomingClasses, icon: Calendar, color: '#610981' },
    { name: "Completed", value: completedClasses, icon: CheckCircle, color: '#10b981' },
    { name: "Avg. Attendance", value: `${avgAttendance}%`, icon: TrendingUp, color: '#3b82f6' },
  ];

  const todayClasses = [
    { id: '1', name: 'Morning Hatha Flow', time: '6:00 AM - 7:00 AM', students: 15, status: 'upcoming' },
    { id: '2', name: 'Power Yoga', time: '10:00 AM - 11:00 AM', students: 12, status: 'upcoming' },
    { id: '3', name: 'Evening Meditation', time: '6:00 PM - 7:00 PM', students: 20, status: 'upcoming' },
  ];

  const handleStartClass = (classId: string, className?: string) => {
    if (className) {
      setActiveSession(className);
    }
    toast.success('Starting live session...');
    navigate(`/tutor/video-session?classId=${classId}`);
  };

  const handleEndClass = () => {
    setActiveSession(null);
    toast.success('Session ended successfully');
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-8">
 
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#610981] to-[#8b0fa8] p-8 text-white shadow-2xl shadow-[#ffac96]/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff691d]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#ffac96]/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    Yoga Tutor
                  </Badge>
                </div>
                <h1 className="text-4xl font-bold mb-2">Welcome, {tutorName}! 👋</h1>
                <p className="text-white/80 text-lg">Ready to inspire your students today?</p>
              </div>
              {activeSession && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    <div>
                      <p className="text-sm font-medium">Active Session</p>
                      <p className="text-lg font-bold">{activeSession}</p>
                    </div>
                    <Button 
                      onClick={handleEndClass}
                      variant="secondary"
                      size="sm"
                      className="ml-4"
                    >
                      End Class
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
 
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="relative overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-[#ffac96]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: '#ffac96' }}>
                  {stat.name}
                </CardTitle>
                <div className="p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => navigate('/tutor/attendance')}
            className="group relative overflow-hidden rounded-2xl border-0 shadow-md hover:shadow-xl transition-all text-left p-6"
            style={{
              background: 'radial-gradient(circle at top right, #ff691d33 0%, #ff691d10 35%, #ffffff 75%)',
            }}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-[#ff691d] flex items-center justify-center shadow-lg shadow-[#ff691d]/30">
                <ClipboardCheck className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#ff691d] group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold mb-1" style={{ color: '#ff691d' }}>
              Teaching Activity
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              View your classes and performance
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Classes This Month</span>
              <span className="text-lg font-bold" style={{ color: '#ff691d' }}>32</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/tutor/referrals')}
            className="group relative overflow-hidden rounded-2xl border-0 shadow-md hover:shadow-xl transition-all text-left p-6"
            style={{
              background: 'radial-gradient(circle at top right, #a855f733 0%, #a855f710 35%, #ffffff 75%)',
            }}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#a020c8] to-[#610981] flex items-center justify-center shadow-lg shadow-[#610981]/30">
                <Gift className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#610981] group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold mb-1" style={{ color: '#610981' }}>
              Referral Program
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Refer students and tutors to earn rewards
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Total Earnings</span>
              <span className="text-lg font-bold" style={{ color: '#610981' }}>₹20,400</span>
            </div>
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#610981]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: '#ff691d' }}>Today's Schedule</CardTitle>
              <CardDescription>Your classes for {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayClasses.map((cls) => (
                <div 
                  key={cls.id}
                  className="group relative flex items-center justify-between p-4 border border-border/50 rounded-xl hover:shadow-lg hover:shadow-[#ffac96]/20 transition-all duration-300 hover:border-[#ffac96]/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{cls.name}</h4>
                      {activeSession === cls.name ? (
                        <Badge className="bg-green-500">Live</Badge>
                      ) : (
                        <Badge variant="outline">{cls.status}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {cls.time}
                    </p>
                    <p className="text-sm" style={{ color: '#ffac96' }}>
                      <Users className="w-3 h-3 inline mr-1" />
                      {cls.students} students enrolled
                    </p>
                  </div>
                  {!activeSession && cls.status === "upcoming" && (
                    <Button
                      onClick={() => handleStartClass(cls.id, cls.name)}
                      className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
 
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 bg-[#ff691d]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: '#ff691d' }}>Class Enrollment</CardTitle>
              <CardDescription>Students per class</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={classPerformanceData}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis key="xaxis" dataKey="name" stroke="#9ca3af" />
                  <YAxis key="yaxis" stroke="#9ca3af" />
                  <Tooltip 
                    key="tooltip"
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #ffac96',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(255, 172, 150, 0.2)'
                    }}
                  />
                  <Bar
                    key="bar"
                    dataKey="students"
                    fill="#610981"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#ffac96]/5 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle style={{ color: '#ff691d' }}>Recent Referrals</CardTitle>
                <CardDescription>Your latest referral activity</CardDescription>
              </div>
              <button
                onClick={() => navigate('/tutor/referrals')}
                className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: '#610981' }}
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { id: 1, name: 'Rajesh Kumar', type: 'Student', time: '2 days ago', amount: 300 },
                { id: 2, name: 'Kavita Singh', type: 'Tutor', time: '5 days ago', amount: 3000 },
                { id: 3, name: 'Anjali Mehta', type: 'Student', time: '1 week ago', amount: 300 },
              ].map((ref) => {
                const isTutor = ref.type === 'Tutor';
                return (
                  <div
                    key={ref.id}
                    className="flex items-center justify-between p-3 border border-border/50 rounded-xl hover:shadow-md hover:border-[#ffac96]/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: isTutor
                            ? 'radial-gradient(circle at top right, #c9a8e0 0%, #ddc4ec 40%, #f0e4f7 100%)'
                            : 'radial-gradient(circle at top right, #ffac9655 0%, #ffd8c2 40%, #fff0e6 100%)',
                        }}
                      >
                        {isTutor ? (
                          <GraduationCap className="w-5 h-5" style={{ color: '#610981' }} strokeWidth={2.25} />
                        ) : (
                          <Users className="w-5 h-5" style={{ color: '#ff691d' }} strokeWidth={2.25} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{ref.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {ref.type} • {ref.time}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/15 border-0 flex items-center gap-0.5">
                      <span>+</span>
                      <IndianRupee className="w-3 h-3" />
                      <span>{ref.amount.toLocaleString('en-IN')}</span>
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#ff691d]/5 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle style={{ color: '#ff691d' }}>This Month's Achievements</CardTitle>
                <CardDescription>Your teaching milestones</CardDescription>
              </div>
              <button
                onClick={() => navigate('/tutor/attendance')}
                className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: '#610981' }}
              >
                View Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#ff691d] to-[#ff8c4a] flex items-center justify-center shadow-md shadow-[#ff691d]/30 shrink-0">
                  <Award className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base mb-1.5">32 Classes Conducted</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-[#ff691d] to-[#ff4444]"
                        style={{ width: '91%' }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">91%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#a020c8] to-[#610981] flex items-center justify-center shadow-md shadow-[#610981]/30 shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base">234 Teaching Hours</h4>
                  <p className="text-xs text-muted-foreground">+18 hours from last month</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#10b981] to-[#059669] flex items-center justify-center shadow-md shadow-[#10b981]/30 shrink-0">
                  <Users className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base">342 Students Taught</h4>
                  <p className="text-xs text-muted-foreground">Across all classes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}