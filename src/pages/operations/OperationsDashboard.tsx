import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { UserCog, Phone, Bell, Ticket, UserPlus, GraduationCap, Clock, LogIn, LogOut, IndianRupee } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { getMyOperationsAttendance, operationsCheckIn, operationsCheckOut } from "../../api/attendance";
import { getOperationsDashboard, type OperationsDashboard as OperationsDashboardData } from "../../api/dashboard";
import type { MyOperationsAttendance } from "../../api/types";

export function OperationsDashboard() {
  const [attendance, setAttendance] = useState<MyOperationsAttendance>(null);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true);
  const [isClocking, setIsClocking] = useState(false);
  const [dashboardData, setDashboardData] = useState<OperationsDashboardData | null>(null);

  useEffect(() => {
    setIsAttendanceLoading(true);
    getMyOperationsAttendance("OPERATIONS")
      .then(setAttendance)
      .catch(() => setAttendance(null))
      .finally(() => setIsAttendanceLoading(false));
  }, []);

  useEffect(() => {
    getOperationsDashboard("OPERATIONS")
      .then(setDashboardData)
      .catch(() => setDashboardData(null));
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
  const fmtDiff = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `${n}` : "-");

  const metrics = [
    {
      title: 'Active Yoga Shikshaks',
      value: dashboardData ? dashboardData.cards.tutors.total.toLocaleString() : '-',
      change: dashboardData ? fmtDiff(dashboardData.cards.tutors.diff) : null,
      icon: GraduationCap, color: '#610981', href: '/operations/tutors',
    },
    {
      title: 'Frontline Team',
      value: dashboardData ? dashboardData.cards.frontline.total.toLocaleString() : '-',
      change: dashboardData ? fmtDiff(dashboardData.cards.frontline.diff) : null,
      icon: Phone, color: '#10b981', href: '/operations/frontline-team',
    },
    {
      title: 'Active Sādhakas',
      value: dashboardData ? dashboardData.cards.students.total.toLocaleString() : '-',
      change: dashboardData ? fmtDiff(dashboardData.cards.students.diff) : null,
      icon: UserPlus, color: '#f59e0b', href: '/operations/users',
    },
  ];

  const fmtRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const fmtPaymentType = (type: string) =>
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const audienceColor = (audience: string) => {
    switch (audience) {
      case "ALL": return '#610981';
      case "STUDENTS": return '#f59e0b';
      case "TUTORS": return '#ff691d';
      default: return '#64748b';
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
 
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Operations Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage business operations and team activities</p>
          </div>

          {/* Compact attendance widget */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-2xl border-2 bg-white shadow-sm sm:shrink-0" style={{ borderColor }}>
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
 
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Link key={index} to={metric.href}>
              <Card className="relative overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300">
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
                    {metric.change != null && (
                      <span className={`text-sm font-medium ${metric.change.startsWith('-') ? 'text-red-500' : 'text-green-600'}`}>
                        {metric.change}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
              </Link>
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
                  <span className="text-sm font-semibold">{dashboardData ? dashboardData.team.employees : '-'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5" style={{ color: '#ff691d' }} />
                    <span className="font-medium">Yoga Shikshaks</span>
                  </div>
                  <span className="text-sm font-semibold">{dashboardData ? dashboardData.team.tutors : '-'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" style={{ color: '#10b981' }} />
                    <span className="font-medium">Frontline Team</span>
                  </div>
                  <span className="text-sm font-semibold">{dashboardData ? dashboardData.team.frontline : '-'}</span>
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
                  <span className="text-sm font-semibold">{dashboardData ? dashboardData.system.coupons : '-'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                    <span className="font-medium">Notifications Sent</span>
                  </div>
                  <span className="text-sm font-semibold">{dashboardData ? dashboardData.system.notifications : '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
 
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Payments */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#610981]/5 rounded-full blur-3xl" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle style={{ color: '#ff691d' }}>Recent Payments</CardTitle>
                <Badge variant="secondary" className="text-xs">Last 5</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!dashboardData ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
                ) : dashboardData.recentPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No payments yet</p>
                ) : dashboardData.recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:shadow-sm transition-shadow">
                    <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: '#ff691d20' }}>
                      <IndianRupee className="w-4 h-4" style={{ color: '#ff691d' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.studentName}</p>
                      <p className="text-xs text-muted-foreground">{fmtPaymentType(p.type)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-semibold text-green-600">₹{p.amount.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-muted-foreground">{fmtRelative(p.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#10b981]/5 rounded-full blur-3xl" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle style={{ color: '#ff691d' }}>Recent Notifications</CardTitle>
                <Badge className="text-xs" style={{ backgroundColor: '#8b5cf6' }}>Last 5</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!dashboardData ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
                ) : dashboardData.recentNotifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No notifications yet</p>
                ) : dashboardData.recentNotifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow" style={{ backgroundColor: `${audienceColor(n.targetAudience)}05` }}>
                    <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${audienceColor(n.targetAudience)}20` }}>
                      <Bell className="w-4 h-4" style={{ color: audienceColor(n.targetAudience) }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: audienceColor(n.targetAudience), color: audienceColor(n.targetAudience) }}
                          >
                            {n.sent ? 'Sent' : 'Scheduled'}
                          </Badge>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{fmtRelative(n.createdAt)}</span>
                        </div>
                      </div>
                    </div>
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