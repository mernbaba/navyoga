import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Users, Calendar, Clock, TrendingUp, CheckCircle, AlertCircle, Sparkles, Play } from "lucide-react";
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
 
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#610981] to-[#8b0fa8] p-8 text-white shadow-2xl shadow-[#ffac96]/30">
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
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ffac96]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              
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
                      className="bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
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
      </div>
    </div>
  );
}