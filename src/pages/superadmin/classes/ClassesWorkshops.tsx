import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import { Textarea } from "../../../components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  Users,
  IndianRupee,
  Sparkles,
  ClipboardList,
  ListVideo,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  listWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  listWorkshopEnrollments,
  removeWorkshopEnrollment,
  listWorkshopSessions,
  addWorkshopSession,
  updateWorkshopSession,
  deleteWorkshopSession,
  type CreateWorkshopInput,
  type CreateSessionInput,
} from "../../../api/workshops";
import type {
  Workshop,
  WorkshopEnrollmentRow,
  WorkshopSession,
  WorkshopMode,
  ClassLevel,
  WorkshopSessionStatus,
} from "../../../api/types";

const LIMIT = 15;
const ENROLLMENTS_LIMIT = 20;
const MODES: WorkshopMode[] = ["LIVE", "RECORDED", "HYBRID"];
const LEVELS: ClassLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"];
const SESSION_STATUSES: WorkshopSessionStatus[] = ["UPCOMING", "LIVE", "COMPLETED", "CANCELLED"];

type WorkshopFormFields = {
  title: string;
  description: string;
  yogaType: string;
  mode: WorkshopMode;
  level: ClassLevel;
  price: string;
  thumbnail: string;
  instructorName: string;
  startDate: string;
  endDate: string;
  totalDuration: string;
  capacity: string;
};

const emptyWorkshopForm = (): WorkshopFormFields => ({
  title: "",
  description: "",
  yogaType: "",
  mode: "LIVE",
  level: "ALL_LEVELS",
  price: "0",
  thumbnail: "",
  instructorName: "",
  startDate: "",
  endDate: "",
  totalDuration: "",
  capacity: "",
});

type SessionFormFields = {
  title: string;
  sortOrder: string;
  mode: WorkshopMode;
  scheduledAt: string;
  duration: string;
  link: string;
  video: string;
  status: WorkshopSessionStatus;
};

const emptySessionForm = (workshopMode: WorkshopMode): SessionFormFields => ({
  title: "",
  sortOrder: "",
  mode: workshopMode,
  scheduledAt: "",
  duration: "",
  link: "",
  video: "",
  status: "UPCOMING",
});

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function workshopToForm(w: Workshop): WorkshopFormFields {
  return {
    title: w.title,
    description: w.description,
    yogaType: w.yogaType,
    mode: w.mode,
    level: w.level,
    price: w.price,
    thumbnail: w.thumbnail ?? "",
    instructorName: w.instructorName ?? "",
    startDate: toDatetimeLocal(w.startDate),
    endDate: toDatetimeLocal(w.endDate),
    totalDuration: w.totalDuration != null ? String(w.totalDuration) : "",
    capacity: w.capacity != null ? String(w.capacity) : "",
  };
}

function buildWorkshopBody(form: WorkshopFormFields): CreateWorkshopInput {
  const body: CreateWorkshopInput = {
    title: form.title.trim(),
    description: form.description.trim(),
    yogaType: form.yogaType.trim(),
    mode: form.mode,
    level: form.level,
    price: Number(form.price) || 0,
  };
  if (form.thumbnail.trim()) body.thumbnail = form.thumbnail.trim();
  if (form.instructorName.trim()) body.instructorName = form.instructorName.trim();
  const startIso = fromDatetimeLocal(form.startDate);
  if (startIso) body.startDate = startIso;
  const endIso = fromDatetimeLocal(form.endDate);
  if (endIso) body.endDate = endIso;
  if (form.totalDuration.trim()) {
    const n = Number(form.totalDuration);
    if (Number.isFinite(n) && n > 0) body.totalDuration = n;
  }
  if (form.capacity.trim()) {
    const n = Number(form.capacity);
    if (Number.isFinite(n) && n >= 0) body.capacity = n;
  }
  return body;
}

function isWorkshopFormValid(form: WorkshopFormFields): boolean {
  return Boolean(
    form.title.trim() &&
    form.description.trim() &&
    form.yogaType.trim() &&
    form.mode &&
    Number(form.price) >= 0,
  );
}

function modeBadgeColor(mode: WorkshopMode) {
  switch (mode) {
    case "LIVE": return "#ef4444";
    case "RECORDED": return "#3b82f6";
    case "HYBRID": return "#8b5cf6";
  }
}

function levelLabel(level: ClassLevel) {
  return level === "ALL_LEVELS" ? "All Levels" : level.charAt(0) + level.slice(1).toLowerCase();
}

type FormMode = "create" | "edit";

export function ClassesWorkshops() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<WorkshopMode | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkshopFormFields>(emptyWorkshopForm());
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Workshop | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Enrollments dialog
  const [enrollmentsWorkshop, setEnrollmentsWorkshop] = useState<Workshop | null>(null);
  const [enrollments, setEnrollments] = useState<WorkshopEnrollmentRow[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentsSearch, setEnrollmentsSearch] = useState("");
  const [debouncedEnrollSearch, setDebouncedEnrollSearch] = useState("");
  const [enrollmentsPage, setEnrollmentsPage] = useState(1);
  const [enrollmentsTotal, setEnrollmentsTotal] = useState(0);
  const [enrollmentsTotalPages, setEnrollmentsTotalPages] = useState(1);

  // Sessions dialog
  const [sessionsWorkshop, setSessionsWorkshop] = useState<Workshop | null>(null);
  const [sessions, setSessions] = useState<WorkshopSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionFormMode, setSessionFormMode] = useState<FormMode>("create");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionFormFields>(emptySessionForm("LIVE"));
  const [sessionSaving, setSessionSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedEnrollSearch(enrollmentsSearch), 300);
    return () => clearTimeout(t);
  }, [enrollmentsSearch]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, modeFilter]);

  // Load list
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listWorkshops("SUPERADMIN", {
      page,
      limit: LIMIT,
      q: debouncedSearch || undefined,
      mode: modeFilter === "ALL" ? undefined : modeFilter,
    })
      .then((res) => {
        if (cancelled) return;
        setWorkshops(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load workshops.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, modeFilter]);

  // Load enrollments
  useEffect(() => {
    if (!enrollmentsWorkshop) return;
    let cancelled = false;
    setEnrollmentsLoading(true);
    listWorkshopEnrollments("SUPERADMIN", enrollmentsWorkshop.id, {
      page: enrollmentsPage,
      limit: ENROLLMENTS_LIMIT,
      q: debouncedEnrollSearch || undefined,
    })
      .then((res) => {
        if (cancelled) return;
        setEnrollments(res.items);
        setEnrollmentsTotal(res.total);
        setEnrollmentsTotalPages(res.totalPages);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load enrollments.");
      })
      .finally(() => {
        if (!cancelled) setEnrollmentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enrollmentsWorkshop, enrollmentsPage, debouncedEnrollSearch]);

  // Load sessions
  useEffect(() => {
    if (!sessionsWorkshop) return;
    let cancelled = false;
    setSessionsLoading(true);
    listWorkshopSessions("SUPERADMIN", sessionsWorkshop.id)
      .then((res) => {
        if (!cancelled) setSessions(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load sessions.");
      })
      .finally(() => {
        if (!cancelled) setSessionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionsWorkshop]);

  function openCreate() {
    setFormMode("create");
    setEditingId(null);
    setForm(emptyWorkshopForm());
    setFormOpen(true);
  }

  function openEdit(w: Workshop) {
    setFormMode("edit");
    setEditingId(w.id);
    setForm(workshopToForm(w));
    setFormOpen(true);
  }

  async function handleSaveWorkshop() {
    if (!isWorkshopFormValid(form)) return;
    setSaving(true);
    try {
      const body = buildWorkshopBody(form);
      if (formMode === "create") {
        await createWorkshop("SUPERADMIN", body);
        toast.success("Workshop created");
      } else if (editingId) {
        await updateWorkshop("SUPERADMIN", editingId, body);
        toast.success("Workshop updated");
      }
      setFormOpen(false);
      // refresh
      const res = await listWorkshops("SUPERADMIN", {
        page,
        limit: LIMIT,
        q: debouncedSearch || undefined,
        mode: modeFilter === "ALL" ? undefined : modeFilter,
      });
      setWorkshops(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save workshop.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteWorkshop("SUPERADMIN", deleteTarget.id);
      toast.success("Workshop deleted");
      setDeleteTarget(null);
      setWorkshops((prev) => prev.filter((w) => w.id !== deleteTarget.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete workshop.");
    } finally {
      setDeleting(false);
    }
  }

  function openEnrollments(w: Workshop) {
    setEnrollmentsWorkshop(w);
    setEnrollmentsPage(1);
    setEnrollmentsSearch("");
    setDebouncedEnrollSearch("");
  }

  async function handleRemoveEnrollment(enrollmentId: string) {
    if (!enrollmentsWorkshop) return;
    if (!confirm("Remove this enrollment?")) return;
    try {
      await removeWorkshopEnrollment("SUPERADMIN", enrollmentsWorkshop.id, enrollmentId);
      toast.success("Enrollment removed");
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      setEnrollmentsTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove enrollment.");
    }
  }

  function openSessions(w: Workshop) {
    setSessionsWorkshop(w);
  }

  function openCreateSession() {
    if (!sessionsWorkshop) return;
    setSessionFormMode("create");
    setEditingSessionId(null);
    setSessionForm({
      ...emptySessionForm(sessionsWorkshop.mode),
      sortOrder: String(sessions.length + 1),
    });
    setSessionDialogOpen(true);
  }

  function openEditSession(s: WorkshopSession) {
    setSessionFormMode("edit");
    setEditingSessionId(s.id);
    setSessionForm({
      title: s.title,
      sortOrder: String(s.sortOrder),
      mode: s.mode,
      scheduledAt: toDatetimeLocal(s.scheduledAt),
      duration: s.duration != null ? String(s.duration) : "",
      link: s.link ?? "",
      video: s.video ?? "",
      status: s.status ?? "UPCOMING",
    });
    setSessionDialogOpen(true);
  }

  async function handleSaveSession() {
    if (!sessionsWorkshop) return;
    if (!sessionForm.title.trim()) return;
    const sortOrder = Number(sessionForm.sortOrder);
    if (!Number.isFinite(sortOrder) || sortOrder < 0) return;
    setSessionSaving(true);
    try {
      const body: CreateSessionInput = {
        title: sessionForm.title.trim(),
        sortOrder,
        mode: sessionForm.mode,
        status: sessionForm.status,
      };
      const scheduledIso = fromDatetimeLocal(sessionForm.scheduledAt);
      if (scheduledIso) body.scheduledAt = scheduledIso;
      if (sessionForm.duration.trim()) {
        const n = Number(sessionForm.duration);
        if (Number.isFinite(n) && n > 0) body.duration = n;
      }
      if (sessionForm.link.trim()) body.link = sessionForm.link.trim();
      if (sessionForm.video.trim()) body.video = sessionForm.video.trim();

      if (sessionFormMode === "create") {
        const created = await addWorkshopSession("SUPERADMIN", sessionsWorkshop.id, body);
        setSessions((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
        toast.success("Session added");
      } else if (editingSessionId) {
        const updated = await updateWorkshopSession(
          "SUPERADMIN",
          sessionsWorkshop.id,
          editingSessionId,
          body,
        );
        setSessions((prev) =>
          prev.map((s) => (s.id === editingSessionId ? updated : s)).sort((a, b) => a.sortOrder - b.sortOrder),
        );
        toast.success("Session updated");
      }
      setSessionDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save session.");
    } finally {
      setSessionSaving(false);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!sessionsWorkshop) return;
    if (!confirm("Delete this session?")) return;
    try {
      await deleteWorkshopSession("SUPERADMIN", sessionsWorkshop.id, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Session deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete session.");
    }
  }

  const totalCapacity = workshops.reduce((sum, w) => sum + (w.capacity ?? 0), 0);
  const totalEnrolled = workshops.reduce((sum, w) => sum + w.enrollmentCount, 0);
  const liveCount = workshops.filter((w) => w.mode === "LIVE").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-linear-to-br from-[#610981] to-[#8b0fa8] shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#610981" }}>
              Workshops
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage live, recorded, and hybrid yoga workshops
            </p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2"
          style={{ background: "#610981", color: "white" }}
        >
          <Plus className="w-4 h-4" /> Add Workshop
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Workshops" value={total} icon={<Layers className="w-5 h-5 text-white" />} gradient="from-orange-500 to-red-500" />
        <StatCard label="Live (this page)" value={liveCount} icon={<Calendar className="w-5 h-5 text-white" />} gradient="from-rose-500 to-pink-500" />
        <StatCard label="Total Capacity" value={totalCapacity} icon={<Users className="w-5 h-5 text-white" />} gradient="from-purple-600 to-pink-600" />
        <StatCard label="Total Enrolled" value={totalEnrolled} icon={<Sparkles className="w-5 h-5 text-white" />} gradient="from-emerald-500 to-teal-500" />
      </div>

      {/* Search + Filter */}
      <Card className="border-0 shadow-md">
        <CardContent className="py-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <Input
              placeholder="Search by title, yoga type or description..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant={modeFilter === "ALL" ? "default" : "outline"} size="sm" onClick={() => setModeFilter("ALL")}>
              All
            </Button>
            {MODES.map((m) => (
              <Button
                key={m}
                variant={modeFilter === m ? "default" : "outline"}
                size="sm"
                onClick={() => setModeFilter(m)}
                style={modeFilter === m ? { background: modeBadgeColor(m), color: "white" } : undefined}
              >
                {m}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg" style={{ color: "#ff691d" }}>
            All Workshops <span className="text-sm font-normal text-muted-foreground ml-2">{total} total</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-4">Workshop</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Enrolled</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : workshops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {debouncedSearch || modeFilter !== "ALL" ? "No workshops match your filters." : "No workshops yet."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  workshops.map((w) => (
                    <TableRow key={w.id} className="hover:bg-muted/20">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          {w.thumbnail ? (
                            <img
                              src={w.thumbnail}
                              alt={w.title}
                              className="w-10 h-10 rounded-md object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-linear-to-br from-[#610981]/15 to-[#ff691d]/10 flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-[#610981]" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{w.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{w.yogaType}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge style={{ background: modeBadgeColor(w.mode), color: "white" }}>
                          {w.mode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{levelLabel(w.level)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {w.startDate ? formatDate(w.startDate) : "—"}
                        {w.endDate && (<><span className="mx-1">→</span>{formatDate(w.endDate)}</>)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {w.enrollmentCount}
                        {w.capacity != null && <span className="text-muted-foreground">/{w.capacity}</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {Number(w.price) === 0 ? "Free" : (
                          <span className="inline-flex items-center">
                            <IndianRupee className="w-3 h-3" />
                            {Number(w.price).toLocaleString("en-IN")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Sessions" onClick={() => openSessions(w)}>
                            <ListVideo className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Enrollments" onClick={() => openEnrollments(w)}>
                            <ClipboardList className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit" onClick={() => openEdit(w)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700" title="Delete" onClick={() => setDeleteTarget(w)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Workshop Dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => { if (!saving) setFormOpen(v); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: "#610981" }}>
              {formMode === "create" ? "Add Workshop" : "Edit Workshop"}
            </DialogTitle>
            <DialogDescription>
              {formMode === "create" ? "Create a new workshop. Sessions can be added after creation." : "Update workshop details."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="ws-title">Title <span className="text-red-500">*</span></Label>
              <Input id="ws-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Sunday Morning Vinyasa Workshop" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ws-desc">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="ws-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What students will learn"
                rows={3}
                className="min-h-20 max-h-40"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ws-yoga">Yoga Type <span className="text-red-500">*</span></Label>
                <Input id="ws-yoga" value={form.yogaType} onChange={(e) => setForm({ ...form, yogaType: e.target.value })} placeholder="e.g. Vinyasa, Hatha" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ws-instructor">Instructor Name</Label>
                <Input id="ws-instructor" value={form.instructorName} onChange={(e) => setForm({ ...form, instructorName: e.target.value })} placeholder="optional · for guest instructors" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Mode <span className="text-red-500">*</span></Label>
                <Select value={form.mode} onValueChange={(v: WorkshopMode) => setForm({ ...form, mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v: ClassLevel) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => <SelectItem key={l} value={l}>{levelLabel(l)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ws-price">Price (₹) <span className="text-red-500">*</span></Label>
                <Input
                  id="ws-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ws-capacity">Capacity</Label>
                <Input
                  id="ws-capacity"
                  type="number"
                  min={0}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  placeholder="optional"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ws-start">Start Date</Label>
                <Input id="ws-start" type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ws-end">End Date</Label>
                <Input id="ws-end" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ws-duration">Total Duration (min)</Label>
                <Input
                  id="ws-duration"
                  type="number"
                  min={0}
                  value={form.totalDuration}
                  onChange={(e) => setForm({ ...form, totalDuration: e.target.value })}
                  placeholder="optional"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ws-thumb">Thumbnail URL</Label>
                <Input id="ws-thumb" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} placeholder="optional · image URL" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              disabled={saving || !isWorkshopFormValid(form)}
              onClick={handleSaveWorkshop}
              style={{ background: "#610981", color: "white" }}
            >
              {saving ? "Saving..." : formMode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v && !deleting) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete workshop?</DialogTitle>
            <DialogDescription>
              This will permanently remove "{deleteTarget?.title}" and all its sessions and enrollments. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleting} onClick={handleConfirmDelete}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrollments Dialog */}
      <Dialog open={!!enrollmentsWorkshop} onOpenChange={(v) => { if (!v) setEnrollmentsWorkshop(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" /> Enrollments
            </DialogTitle>
            <DialogDescription className="truncate">
              {enrollmentsWorkshop?.title} · <span className="font-medium text-foreground">{enrollmentsTotal}</span> enrolled
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <Input
              placeholder="Search by name, email or phone..."
              className="pl-9"
              value={enrollmentsSearch}
              onChange={(e) => { setEnrollmentsSearch(e.target.value); setEnrollmentsPage(1); }}
            />
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg mt-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-4">Student</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Enrolled On</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollmentsLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    <div className="w-6 h-6 mx-auto border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                  </TableCell></TableRow>
                ) : enrollments.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-sm text-muted-foreground">
                    {debouncedEnrollSearch ? "No students match your search." : "No enrollments yet."}
                  </TableCell></TableRow>
                ) : (
                  enrollments.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#610981]/15 to-[#ff691d]/10 flex items-center justify-center text-[#610981] font-semibold text-xs">
                            {row.student.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-sm font-medium">{row.student.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex flex-col leading-tight">
                          <span>{row.student.email}</span>
                          <span className="text-xs">{row.student.phone ?? "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(row.enrolledAt)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => handleRemoveEnrollment(row.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {enrollmentsTotalPages > 1 && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Page {enrollmentsPage} of {enrollmentsTotalPages}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={enrollmentsPage <= 1} onClick={() => setEnrollmentsPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <Button size="sm" variant="outline" disabled={enrollmentsPage >= enrollmentsTotalPages} onClick={() => setEnrollmentsPage((p) => Math.min(enrollmentsTotalPages, p + 1))}>Next</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sessions Dialog */}
      <Dialog open={!!sessionsWorkshop} onOpenChange={(v) => { if (!v) { setSessionsWorkshop(null); setSessions([]); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListVideo className="w-5 h-5" /> Sessions
            </DialogTitle>
            <DialogDescription className="truncate">
              {sessionsWorkshop?.title} · {sessions.length} session{sessions.length === 1 ? "" : "s"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button size="sm" onClick={openCreateSession} style={{ background: "#610981", color: "white" }}>
              <Plus className="w-4 h-4 mr-1" /> Add Session
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-4 w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionsLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <div className="w-6 h-6 mx-auto border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                  </TableCell></TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                    No sessions yet.
                  </TableCell></TableRow>
                ) : (
                  sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="pl-4 text-xs text-muted-foreground">{s.sortOrder}</TableCell>
                      <TableCell className="text-sm font-medium">{s.title}</TableCell>
                      <TableCell>
                        <Badge style={{ background: modeBadgeColor(s.mode), color: "white" }}>{s.mode}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {s.scheduledAt ? new Date(s.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.duration != null ? `${s.duration} min` : "—"}
                      </TableCell>
                      <TableCell>
                        {s.status ? <Badge variant="outline">{s.status}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditSession(s)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => handleDeleteSession(s.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Session Dialog */}
      <Dialog open={sessionDialogOpen} onOpenChange={(v) => { if (!sessionSaving) setSessionDialogOpen(v); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{sessionFormMode === "create" ? "Add Session" : "Edit Session"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="ses-title">Title <span className="text-red-500">*</span></Label>
              <Input id="ses-title" value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ses-order">Order <span className="text-red-500">*</span></Label>
                <Input
                  id="ses-order"
                  type="number"
                  min={0}
                  value={sessionForm.sortOrder}
                  onChange={(e) => setSessionForm({ ...sessionForm, sortOrder: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Mode</Label>
                <Select value={sessionForm.mode} onValueChange={(v: WorkshopMode) => setSessionForm({ ...sessionForm, mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ses-when">Scheduled At</Label>
                <Input id="ses-when" type="datetime-local" value={sessionForm.scheduledAt} onChange={(e) => setSessionForm({ ...sessionForm, scheduledAt: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ses-dur">Duration (min)</Label>
                <Input
                  id="ses-dur"
                  type="number"
                  min={0}
                  value={sessionForm.duration}
                  onChange={(e) => setSessionForm({ ...sessionForm, duration: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ses-link">Join Link</Label>
              <Input id="ses-link" value={sessionForm.link} onChange={(e) => setSessionForm({ ...sessionForm, link: e.target.value })} placeholder="optional · live join URL" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ses-video">Recording URL</Label>
              <Input id="ses-video" value={sessionForm.video} onChange={(e) => setSessionForm({ ...sessionForm, video: e.target.value })} placeholder="optional · recording URL" />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={sessionForm.status} onValueChange={(v: WorkshopSessionStatus) => setSessionForm({ ...sessionForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SESSION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={sessionSaving} onClick={() => setSessionDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={sessionSaving || !sessionForm.title.trim()}
              onClick={handleSaveSession}
              style={{ background: "#610981", color: "white" }}
            >
              {sessionSaving ? "Saving..." : sessionFormMode === "create" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon, gradient }: { label: string; value: number; icon: React.ReactNode; gradient: string }) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`p-2.5 rounded-xl bg-linear-to-br ${gradient} shadow-md`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
