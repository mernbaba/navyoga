import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Users, UserCog, Phone, Bell, Ticket, UserPlus, GraduationCap, CalendarDays, Video, Image, TrendingUp, Activity, Clock, LogIn, LogOut } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { getMyOperationsAttendance, operationsCheckIn, operationsCheckOut } from "../../api/attendance";
import type { MyOperationsAttendance } from "../../api/types";

export function OperationsDashboard() {
  const [attendance, setAttendance] = useState<MyOperationsAttendance>(null);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true);
  const [isClocking, setIsClocking] = useState(false);

  useEffect(() => {
    setIsAttendanceLoading(true);
    getMyOperationsAttendance("OPERATIONS")
      .then(setAttendance)
      .catch(() => setAttendance(null))
      .finally(() => setIsAttendanceLoading(false));
  }, []);

  const fmtTime = (ts: string | null) =>
    ts ? new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

  const handleCheckIn = async () => {
    if (isClocking) return;
    setIsClocking(true);
    try {
      await operationsCheckIn("OPERATIONS");
      setAttendance(await getMyOperationsAttendance("OPERATIONS"));
      toast.success("Checked in successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Check-in failed.");
    } finally {
      setIsClocking(false);
    }
  };

  const handleCheckOut = async () => {
    if (isClocking) return;
    setIsClocking(true);
    try {
      await operationsCheckOut("OPERATIONS");
      setAttendance(await getMyOperationsAttendance("OPERATIONS"));
      toast.success("Checked out successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Check-out failed.");
    } finally {
      setIsClocking(false);
    }
  };

  const dotColor = attendance?.checkOut ? "#10b981" : attendance?.checkIn ? "#f59e0b" : "#94a3b8";
  const borderColor = attendance?.checkOut ? "#10b98140" : attendance?.checkIn ? "#f59e0b40" : "#e2e8f0";
  const metrics = [
    { title: 'Total Employees', value: '156', change: '+8', icon: Users, color: '#ff691d' },
    { title: 'Active Tutors', value: '42', change: '+5', icon: GraduationCap, color: '#610981' },
    { title: 'Frontline Team', value: '28', change: '+3', icon: Phone, color: '#10b981' },
    { title: 'Active Users', value: '1,247', change: '+156', icon: UserPlus, color: '#f59e0b' },
    { title: 'Recorded Classes', value: '89', change: '+12', icon: Video, color: '#8b5cf6' },
  ];

  const recentActivities = [
    { id: 1, action: 'New Event Created', user: 'International Yoga Day Celebration', time: '2 mins ago', type: 'event', status: 'Active' },
    { id: 2, action: 'New Banner Created', user: 'Annual Plan 20% OFF', time: '5 mins ago', type: 'banner', status: 'Active' },
    { id: 3, action: 'New Tutor Added', user: 'Priya Sharma', time: '10 mins ago', type: 'tutor', status: 'Completed' },
    { id: 4, action: 'Event Registration', user: '12 new registrations', time: '15 mins ago', type: 'event', status: 'Active' },
    { id: 5, action: 'Notification Sent', user: 'Platform Maintenance Alert', time: '25 mins ago', type: 'notification', status: 'Sent' },
    { id: 6, action: 'Coupon Code Created', user: 'SUMMER25', time: '45 mins ago', type: 'coupon', status: 'Active' },
    { id: 7, action: 'Event Updated', user: 'Advanced Meditation Retreat', time: '1 hour ago', type: 'event', status: 'Updated' },
    { id: 8, action: 'Employee Updated', user: 'Rahul Kumar', time: '2 hours ago', type: 'employee', status: 'Completed' },
  ];

  const quickStats = [
    { label: 'Pending Approvals', value: '12', color: '#f59e0b' },
    { label: 'Active Coupons', value: '8', color: '#10b981' },
    { label: 'New Leads Today', value: '34', color: '#610981' },
    { label: 'Scheduled Classes', value: '156', color: '#ff691d' },
  ];

  const recentUpdates = [
    {
      module: 'Events Management',
      update: 'New Events Module Added',
      description: 'Operations team can now create, read, edit and delete events. Users can browse and register for events.',
      date: 'Today',
      badge: 'New Module',
      color: '#3b82f6'
    },
    {
      module: 'App Notifications',
      update: 'Added User Banner Management',
      description: 'New tab for creating and managing promotional banners with image upload support',
      date: 'Today',
      badge: 'New Feature',
      color: '#10b981'
    },
    {
      module: 'App Notifications',
      update: 'Enhanced Analytics',
      description: 'Added banner impression tracking, click rates, and performance metrics',
      date: 'Today',
      badge: 'Enhancement',
      color: '#610981'
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'event': return <CalendarDays className="w-4 h-4" />;
      case 'banner': return <Image className="w-4 h-4" />;
      case 'tutor': return <GraduationCap className="w-4 h-4" />;
      case 'notification': return <Bell className="w-4 h-4" />;
      case 'coupon': return <Ticket className="w-4 h-4" />;
      case 'employee': return <Users className="w-4 h-4" />;
      case 'class': return <CalendarDays className="w-4 h-4" />;
      case 'lead': return <UserPlus className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'event': return '#3b82f6';
      case 'banner': return '#10b981';
      case 'tutor': return '#ff691d';
      case 'notification': return '#8b5cf6';
      case 'coupon': return '#f59e0b';
      case 'employee': return '#610981';
      case 'class': return '#3b82f6';
      case 'lead': return '#ec4899';
      default: return '#64748b';
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
 
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Operations Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage business operations and team activities</p>
          </div>

          {/* Compact attendance widget */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 bg-white shadow-sm shrink-0" style={{ borderColor }}>
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold leading-none mb-1">Attendance</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                <span className="text-xs font-semibold leading-none">
                  {isAttendanceLoading
                    ? "Loading..."
                    : attendance?.checkOut
                    ? `In ${fmtTime(attendance.checkIn)} · Out ${fmtTime(attendance.checkOut)}`
                    : attendance?.checkIn
                    ? `In at ${fmtTime(attendance.checkIn)}`
                    : "Not checked in"}
                </span>
              </div>
            </div>
            {!isAttendanceLoading && (
              attendance?.checkOut ? (
                <span className="text-xs font-medium text-green-600 ml-1">✓ Done</span>
              ) : attendance?.checkIn ? (
                <Button size="sm" disabled={isClocking} onClick={handleCheckOut} className="h-7 px-3 text-xs ml-1" style={{ backgroundColor: "#610981" }}>
                  <LogOut className="w-3 h-3 mr-1" />{isClocking ? "..." : "Check Out"}
                </Button>
              ) : (
                <Button size="sm" disabled={isClocking} onClick={handleCheckIn} className="h-7 px-3 text-xs ml-1" style={{ backgroundColor: "#610981" }}>
                  <LogIn className="w-3 h-3 mr-1" />{isClocking ? "..." : "Check In"}
                </Button>
              )
            )}
          </div>
        </div>
 
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
                  style={{ backgroundColor: metric.color }}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${metric.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: metric.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-semibold">{metric.value}</div>
                    <span className="text-sm font-medium text-green-600">{metric.change}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
 
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#ff691d]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: '#ff691d' }}>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <UserCog className="w-5 h-5" style={{ color: '#610981' }} />
                    <span className="font-medium">Employees</span>
                  </div>
                  <span className="text-sm font-semibold">156</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5" style={{ color: '#ff691d' }} />
                    <span className="font-medium">Tutors</span>
                  </div>
                  <span className="text-sm font-semibold">42</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" style={{ color: '#10b981' }} />
                    <span className="font-medium">Frontline Team</span>
                  </div>
                  <span className="text-sm font-semibold">28</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#ffac96]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: '#ff691d' }}>System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Ticket className="w-5 h-5" style={{ color: '#f59e0b' }} />
                    <span className="font-medium">Active Coupons</span>
                  </div>
                  <span className="text-sm font-semibold">8</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                    <span className="font-medium">Notifications Sent</span>
                  </div>
                  <span className="text-sm font-semibold">245</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-5 h-5" style={{ color: '#3b82f6' }} />
                    <span className="font-medium">Active Classes</span>
                  </div>
                  <span className="text-sm font-semibold">156</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                    <span className="font-medium">Recorded Classes</span>
                  </div>
                  <span className="text-sm font-semibold">89</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
 
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#610981]/5 rounded-full blur-3xl" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle style={{ color: '#ff691d' }}>Recent Activities</CardTitle>
                <Badge variant="secondary" className="text-xs">Last 24 hours</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-linear-to-r from-gray-50 to-white border border-gray-100 hover:shadow-sm transition-shadow">
                    <div 
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: `${getActivityColor(activity.type)}20` }}
                    >
                      <div style={{ color: getActivityColor(activity.type) }}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{activity.action}</p>
                          <p className="text-xs text-muted-foreground truncate">{activity.user}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ borderColor: getActivityColor(activity.type), color: getActivityColor(activity.type) }}
                          >
                            {activity.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#10b981]/5 rounded-full blur-3xl" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle style={{ color: '#ff691d' }}>Module Updates</CardTitle>
                <Badge className="text-xs" style={{ backgroundColor: '#10b981' }}>Latest</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUpdates.map((update, index) => (
                  <div key={index} className="p-4 rounded-lg border-2 hover:shadow-md transition-shadow" style={{ borderColor: `${update.color}30`, backgroundColor: `${update.color}05` }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${update.color}20` }}
                        >
                          <TrendingUp className="w-4 h-4" style={{ color: update.color }} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{update.module}</h4>
                          <p className="text-xs text-muted-foreground">{update.date}</p>
                        </div>
                      </div>
                      <Badge 
                        className="text-xs shrink-0"
                        style={{ backgroundColor: update.color, color: 'white' }}
                      >
                        {update.badge}
                      </Badge>
                    </div>
                    <h5 className="font-medium text-sm mb-1" style={{ color: update.color }}>
                      {update.update}
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {update.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}