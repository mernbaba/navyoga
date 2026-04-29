import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Calendar, Check, X, Clock, TrendingUp, Award, Timer, Target, Flame, TrendingDown } from "lucide-react";
import { Button } from "../../components/ui/button";
import { motion } from "motion/react";

export function UserAttendance() {
  const metrics = [
    { title: 'Total Classes', value: '124', icon: Calendar, color: '#ff691d' },
    { title: 'Classes Attended', value: '114', icon: Check, color: '#10b981' },
    { title: 'Classes Missed', value: '10', icon: X, color: '#ef4444' },
    { title: 'Attendance Rate', value: '92%', icon: TrendingUp, color: '#610981' },
  ];
 
  const timeMetrics = [
    { title: 'Total Time This Month', value: '52h 30m', subtext: '+8h from last month', icon: Timer, color: '#ff691d', trend: 'up' },
    { title: 'Average Per Day', value: '1h 45m', subtext: 'Last 30 days', icon: Clock, color: '#10b981', trend: 'up' },
    { title: 'Current Streak', value: '12 days', subtext: 'Personal best: 18 days', icon: Flame, color: '#f59e0b', trend: 'up' },
    { title: 'Monthly Goal', value: '85%', subtext: '51h of 60h target', icon: Target, color: '#610981', trend: 'up' },
  ];

  const attendanceRecords = [
    { 
      id: 1, 
      className: 'Advanced Hatha Yoga', 
      date: 'Mar 27, 2026', 
      time: '6:00 PM',
      instructor: 'Priya Sharma',
      status: 'present',
      duration: '60 min',
      actualTime: 58
    },
    { 
      id: 2, 
      className: 'Pranayama Basics', 
      date: 'Mar 27, 2026', 
      time: '7:00 AM',
      instructor: 'Rahul Kumar',
      status: 'present',
      duration: '45 min',
      actualTime: 45
    },
    { 
      id: 3, 
      className: 'Meditation & Mindfulness', 
      date: 'Mar 26, 2026', 
      time: '8:00 AM',
      instructor: 'Anita Verma',
      status: 'present',
      duration: '30 min',
      actualTime: 32
    },
    { 
      id: 4, 
      className: 'Power Yoga Flow', 
      date: 'Mar 26, 2026', 
      time: '6:30 PM',
      instructor: 'Vikram Singh',
      status: 'present',
      duration: '75 min',
      actualTime: 75
    },
    { 
      id: 5, 
      className: 'Advanced Hatha Yoga', 
      date: 'Mar 25, 2026', 
      time: '6:00 PM',
      instructor: 'Priya Sharma',
      status: 'absent',
      duration: '60 min',
      actualTime: 0
    },
    { 
      id: 6, 
      className: 'Restorative Yoga', 
      date: 'Mar 25, 2026', 
      time: '7:00 PM',
      instructor: 'Priya Sharma',
      status: 'present',
      duration: '60 min',
      actualTime: 60
    },
    { 
      id: 7, 
      className: 'Pranayama Basics', 
      date: 'Mar 24, 2026', 
      time: '7:00 AM',
      instructor: 'Rahul Kumar',
      status: 'present',
      duration: '45 min',
      actualTime: 43
    },
    { 
      id: 8, 
      className: 'Meditation & Mindfulness', 
      date: 'Mar 24, 2026', 
      time: '8:00 AM',
      instructor: 'Anita Verma',
      status: 'present',
      duration: '30 min',
      actualTime: 30
    },
    { 
      id: 9, 
      className: 'Vinyasa Flow', 
      date: 'Mar 23, 2026', 
      time: '6:00 AM',
      instructor: 'Rahul Kumar',
      status: 'late',
      duration: '60 min',
      actualTime: 45
    },
    { 
      id: 10, 
      className: 'Advanced Hatha Yoga', 
      date: 'Mar 23, 2026', 
      time: '6:00 PM',
      instructor: 'Priya Sharma',
      status: 'present',
      duration: '60 min',
      actualTime: 62
    },
  ];

  const monthlyStats = [
    { month: 'January', attended: 28, total: 30, rate: 93, hours: 50 },
    { month: 'February', attended: 26, total: 28, rate: 93, hours: 48 },
    { month: 'March', attended: 10, total: 11, rate: 91, hours: 52.5 },
  ];

  const classWiseAttendance = [
    { className: 'Advanced Hatha Yoga', attended: 12, total: 14, rate: 86, totalHours: 18 },
    { className: 'Pranayama Basics', attended: 10, total: 10, rate: 100, totalHours: 10 },
    { className: 'Meditation & Mindfulness', attended: 18, total: 20, rate: 90, totalHours: 8 },
    { className: 'Power Yoga Flow', attended: 8, total: 10, rate: 80, totalHours: 12 },
    { className: 'Restorative Yoga', attended: 15, total: 16, rate: 94, totalHours: 4.5 },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'late': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      default: return status;
    }
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <div className="space-y-6">
 
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>My Attendance & Time Tracking</h1>
          <p className="text-muted-foreground mt-1">Track your class attendance, practice time, and progress metrics</p>
        </motion.div>

        <motion.div 
          className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div 
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
                  style={{ backgroundColor: metric.color }}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${metric.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: metric.color }} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-xl font-semibold">{metric.value}</div>
                </CardContent>
              </Card>
            );
          })}
          {timeMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={`time-${index}`} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div 
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
                  style={{ backgroundColor: metric.color }}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${metric.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: metric.color }} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-xl font-bold mb-1">{metric.value}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className="line-clamp-1">{metric.subtext}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
 
        <motion.div 
          className="grid gap-6 lg:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
 
          <Card className="relative overflow-hidden border-0 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff691d]/5 rounded-full blur-3xl" />
            <CardHeader className="relative z-10">
              <CardTitle style={{ color: '#ff691d' }}>Monthly Statistics</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {monthlyStats.map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{stat.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold" style={{ color: '#ff691d' }}>
                          {formatHours(stat.hours)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {stat.attended}/{stat.total} classes
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all rounded-full"
                          style={{ 
                            width: `${stat.rate}%`,
                            backgroundColor: stat.rate >= 90 ? '#10b981' : stat.rate >= 75 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">{stat.rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
 
          <Card className="relative overflow-hidden border-0 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#610981]/5 rounded-full blur-3xl" />
            <CardHeader className="relative z-10">
              <CardTitle style={{ color: '#ff691d' }}>Class-wise Time & Attendance</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {classWiseAttendance.map((class_item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{class_item.className}</span>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatHours(class_item.totalHours)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {class_item.attended}/{class_item.total}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all rounded-full"
                          style={{ 
                            width: `${class_item.rate}%`,
                            backgroundColor: '#610981'
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-10 text-right">{class_item.rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
 
        <motion.div 
          className="grid gap-6 lg:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Practice Streak */}
          <Card className="relative overflow-hidden border-2 border-orange-200 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/10 rounded-full blur-3xl" />
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-gradient-to-br from-orange-500 to-red-500">
                  <Flame className="w-12 h-12 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Practice Streak</h3>
                  <p className="text-sm text-muted-foreground">
                    You're on a roll! Keep practicing daily.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold" style={{ color: '#f59e0b' }}>12</div>
                  <p className="text-sm text-muted-foreground">days</p>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Personal Best</span>
                  <span className="font-semibold">18 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
 
          <Card className="relative overflow-hidden border-2 border-green-200 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981]/10 rounded-full blur-3xl" />
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-gradient-to-br from-green-500 to-teal-500">
                  <Target className="w-12 h-12 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Monthly Goal Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    51 hours of 60 hours target
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold" style={{ color: '#10b981' }}>85%</div>
                  <p className="text-sm text-muted-foreground">complete</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full transition-all"
                    style={{ width: '85%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-right">9 hours remaining</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="relative overflow-hidden border-2 shadow-xl" style={{ borderColor: '#10b981' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981]/5 rounded-full blur-3xl" />
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full" style={{ backgroundColor: '#10b98120' }}>
                  <Award className="w-12 h-12" style={{ color: '#10b981' }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Excellent Attendance!</h3>
                  <p className="text-sm text-muted-foreground">
                    You've maintained a 92% attendance rate with 52.5 hours of practice this month. Keep up the great work!
                  </p>
                </div>
                <Badge 
                  className="text-base px-4 py-2" 
                  style={{ backgroundColor: '#10b98120', color: '#10b981' }}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  92%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffac96]/5 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between relative z-10">
              <CardTitle style={{ color: '#ff691d' }}>Recent Attendance Records</CardTitle>
              <Button variant="outline" size="sm">
                Export Report
              </Button>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Class</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Instructor</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Time</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Duration</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Actual Time</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm">{record.date}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-sm">{record.className}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{record.instructor}</td>
                        <td className="py-3 px-4 text-sm">{record.time}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {record.duration}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-semibold" style={{ color: '#610981' }}>
                            {record.actualTime > 0 ? `${record.actualTime} min` : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            style={{ 
                              backgroundColor: `${getStatusColor(record.status)}20`, 
                              color: getStatusColor(record.status) 
                            }}
                          >
                            {getStatusLabel(record.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
