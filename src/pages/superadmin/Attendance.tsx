import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  GraduationCap,
  Phone,
  Store,
  Loader2,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import {
  listStudentAttendance,
  listTutorAttendance,
  listFrontlineAttendance,
  listOperationsAttendance,
} from "../../api/attendance";
import type {
  AttendanceStatus,
  AttendanceSummary,
  FrontlineAttendance,
  OperationsAttendance,
  StudentAttendance,
  TutorAttendance,
} from "../../api/types";

type AttendanceCategory = "users" | "tutors" | "frontline" | "operations";

type AnyAttendance =
  | StudentAttendance
  | TutorAttendance
  | FrontlineAttendance
  | OperationsAttendance;

const categoryMeta: Record<AttendanceCategory, {
  title: string;
  subtitle: string;
  icon: typeof Users;
  searchPlaceholder: string;
}> = {
  users: {
    title: "User Attendance Records",
    subtitle: "Student attendance across all classes",
    icon: Users,
    searchPlaceholder: "Search by name or class...",
  },
  tutors: {
    title: "Tutor Attendance Records",
    subtitle: "Tutor teaching activity and presence",
    icon: GraduationCap,
    searchPlaceholder: "Search by name...",
  },
  frontline: {
    title: "Frontline Team Attendance",
    subtitle: "Lead generation and sales team attendance",
    icon: Phone,
    searchPlaceholder: "Search by name or role...",
  },
  operations: {
    title: "Operations Team Attendance",
    subtitle: "Administrative and operations staff attendance",
    icon: Briefcase,
    searchPlaceholder: "Search by name or role...",
  },
};

const statusPill: Record<AttendanceStatus, string> = {
  PRESENT: "bg-[#3d0d4d] text-white",
  ABSENT: "bg-[#ff6b6b] text-white",
  LATE: "bg-gray-200 text-gray-700",
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

const formatTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const emptySummary: AttendanceSummary = {
  total: 0,
  present: 0,
  absent: 0,
  late: 0,
  attendanceRate: 0,
};

export function Attendance() {
  const [category, setCategory] = useState<AttendanceCategory>("users");
  const [records, setRecords] = useState<AnyAttendance[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>(emptySummary);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const meta = categoryMeta[category];

  useEffect(() => {
    let cancelled = false;
    const params = {
      ...(searchQuery ? { q: searchQuery } : {}),
      ...(filterDate ? { date: filterDate } : {}),
      limit: 100,
    };

    setLoading(true);
    const promise =
      category === "users"
        ? listStudentAttendance("SUPERADMIN", params)
        : category === "tutors"
        ? listTutorAttendance("SUPERADMIN", params)
        : category === "frontline"
        ? listFrontlineAttendance("SUPERADMIN", params)
        : listOperationsAttendance("SUPERADMIN", params);

    promise
      .then((res) => {
        if (cancelled) return;
        setRecords(res.items);
        setSummary(res.summary);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load attendance";
        toast.error(message);
        setRecords([]);
        setSummary(emptySummary);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, searchQuery, filterDate]);

  const dataColumns: { label: string; getValue: (r: AnyAttendance) => string }[] = useMemo(() => {
    switch (category) {
      case "users":
        return [
          { label: "Student Name", getValue: (r) => (r as StudentAttendance).student?.name ?? "—" },
          { label: "Class", getValue: (r) => (r as StudentAttendance).subscriptionClass?.title ?? "—" },
          { label: "Date", getValue: (r) => formatDate(r.date) },
          { label: "Time", getValue: (r) => formatTime((r as StudentAttendance).subscriptionClass?.scheduledAt) },
        ];
      case "tutors":
        return [
          { label: "Tutor Name", getValue: (r) => (r as TutorAttendance).tutor?.name ?? "—" },
          { label: "Classes Conducted", getValue: (r) => {
            const v = (r as TutorAttendance).classesConducted;
            return v == null ? "—" : String(v);
          } },
          { label: "Date", getValue: (r) => formatDate(r.date) },
          { label: "Teaching Hours", getValue: (r) => {
            const v = (r as TutorAttendance).teachingHours;
            return v == null ? "—" : `${v}h`;
          } },
        ];
      case "frontline":
        return [
          { label: "Name", getValue: (r) => {
            const s = (r as FrontlineAttendance).staff;
            return s ? `${s.firstName} ${s.lastName}` : "—";
          } },
          { label: "Role", getValue: (r) => (r as FrontlineAttendance).staff?.designation ?? "—" },
          { label: "Date", getValue: (r) => formatDate(r.date) },
          { label: "Check In", getValue: (r) => formatTime((r as FrontlineAttendance).checkIn) },
          { label: "Check Out", getValue: (r) => formatTime((r as FrontlineAttendance).checkOut) },
        ];
      case "operations":
        return [
          { label: "Name", getValue: (r) => {
            const s = (r as OperationsAttendance).staff;
            return s ? `${s.firstName} ${s.lastName}` : "—";
          } },
          { label: "Role", getValue: (r) => (r as OperationsAttendance).staff?.department ?? "—" },
          { label: "Date", getValue: (r) => formatDate(r.date) },
          { label: "Check In", getValue: (r) => formatTime((r as OperationsAttendance).checkIn) },
          { label: "Check Out", getValue: (r) => formatTime((r as OperationsAttendance).checkOut) },
        ];
    }
  }, [category]);

  const getDisplayId = (r: AnyAttendance): string => {
    if (category === "users") return (r as StudentAttendance).student?.id ?? "—";
    if (category === "tutors") return (r as TutorAttendance).tutor?.tutorId ?? "—";
    return (r as FrontlineAttendance | OperationsAttendance).staff?.employeeId ?? "—";
  };

  const stats = [
    { name: "Total Records", value: summary.total, valueClass: "text-[#ff691d]" },
    { name: "Present", value: summary.present, valueClass: "text-green-500" },
    { name: "Absent", value: summary.absent, valueClass: "text-red-500" },
    { name: "Attendance Rate", value: `${summary.attendanceRate}%`, valueClass: "text-[#610981]" },
  ];

  const renderStatusIcon = (status: AttendanceStatus) => {
    if (status === "PRESENT") return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === "ABSENT") return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#610981] via-[#a020c8] to-[#ff691d] p-7 text-white shadow-2xl shadow-[#ffac96]/30">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-[#ffac96]/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold leading-tight">Attendance Management</h1>
              <p className="text-white/85 text-base mt-0.5">
                Track attendance across all teams and user groups
              </p>
            </div>
          </div>
        </div>

        <Tabs
          value={category}
          onValueChange={(v) => {
            setCategory(v as AttendanceCategory);
            setRecords([]);
            setSummary(emptySummary);
            setLoading(true);
          }}
        >
          <TabsList className="grid w-full grid-cols-4 h-14 bg-muted/30 p-1.5 gap-1 rounded-xl border border-border/40">
            {(Object.keys(categoryMeta) as AttendanceCategory[]).map((key) => {
              const Icon = categoryMeta[key].icon;
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="h-full rounded-lg gap-2 text-gray-400 bg-transparent border-0 transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#610981] data-[state=active]:font-semibold"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="border-border/60 shadow-none hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-3">{stat.name}</p>
                <p className={`text-3xl font-bold ${stat.valueClass}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-[#ffac96]/15 shadow-sm shadow-[#ffac96]/5 bg-linear-to-br from-[#ffac96]/5 via-white to-[#ffac96]/5">
          <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "#ff691d" }}>
                {meta.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{meta.subtitle}</p>
            </div>
            {/* <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#610981] hover:bg-[#7a0a9f] text-white">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Mark Attendance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form>
                  <DialogHeader>
                    <DialogTitle>Mark Attendance</DialogTitle>
                    <DialogDescription>Coming soon</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog> */}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 z-10 pointer-events-none" />
              <Input
                placeholder={meta.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/40"
              />
            </div>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 z-10 pointer-events-none" />
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-10 bg-muted/40 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
          </div>

          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-gray-700 font-bold">ID</TableHead>
                  {dataColumns.map((col) => (
                    <TableHead key={col.label} className="text-gray-700 font-bold">
                      {col.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-gray-700 font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={dataColumns.length + 2} className="text-center py-10">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading attendance…
                      </span>
                    </TableCell>
                  </TableRow>
                ) : records.length > 0 ? (
                  records.map((record) => (
                    <TableRow key={record.id} className="border-border/40">
                      <TableCell className="font-medium">{getDisplayId(record)}</TableCell>
                      {dataColumns.map((col) => (
                        <TableCell key={col.label}>{col.getValue(record)}</TableCell>
                      ))}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {renderStatusIcon(record.status)}
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusPill[record.status]}`}
                          >
                            {record.status.toLowerCase()}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={dataColumns.length + 2} className="text-center text-muted-foreground py-8">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          </CardContent>
        </Card>
    </div>
  );
}
