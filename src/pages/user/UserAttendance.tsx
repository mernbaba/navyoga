import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { Calendar, CalendarCheck, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { getMyClassAttendance } from "../../api/attendance";
import type { MyClassAttendance } from "../../api/types";

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const formatDate = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export function UserAttendance() {
  const [data, setData] = useState<MyClassAttendance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMyClassAttendance()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load attendance");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = data?.summary;
  const records = data?.records ?? [];

  const metrics = [
    {
      title: "Classes Attended",
      value: (summary?.totalAttended ?? 0).toLocaleString(),
      icon: CheckCircle2,
      color: "#10b981",
    },
    {
      title: "This Month",
      value: (summary?.attendedThisMonth ?? 0).toLocaleString(),
      icon: CalendarCheck,
      color: "#ff691d",
    },
    {
      title: "Last Attended",
      value: formatDate(summary?.lastAttendedAt ?? null),
      icon: Calendar,
      color: "#610981",
    },
  ];

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-linear-to-br from-gray-50 via-white to-purple-50/30">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-semibold" style={{ color: "#ff691d" }}>
            My Attendance
          </h1>
          <p className="text-muted-foreground mt-1">
            The live classes you've joined
          </p>
        </motion.div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card
                key={metric.title}
                className="relative overflow-hidden border-0 shadow-lg"
              >
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
                  style={{ backgroundColor: metric.color }}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${metric.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: metric.color }} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  {loading ? (
                    <Skeleton className="h-7 w-20" />
                  ) : (
                    <div className="text-xl font-semibold">{metric.value}</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : records.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No classes attended yet.</p>
                  <p className="text-sm">
                    Join a live class and it will show up here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class</TableHead>
                        <TableHead>Tutor</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div className="font-medium">{r.liveClass.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {r.liveClass.yogaType}
                            </div>
                          </TableCell>
                          <TableCell>{r.liveClass.tutor?.name ?? "—"}</TableCell>
                          <TableCell>{r.liveClass.batch?.name ?? "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDateTime(r.joinedAt)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className="border-0"
                              style={{ backgroundColor: "#10b98120", color: "#10b981" }}
                            >
                              Attended
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
