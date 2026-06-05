import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
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
import { Radio, Plus, Trash2, ChevronRight, GraduationCap, Pencil, Search, Clock, CalendarDays, Link2, User } from "lucide-react";
import { toast } from "sonner";
import {
  listYTTLiveCourses,
  createYTTLiveCourse,
  updateYTTLiveCourse,
  listYTTLiveClasses,
  createYTTLiveClass,
  updateYTTLiveClass,
  deleteYTTLiveClass,
} from "../../../api/plans";
import { listTutors } from "../../../api/tutors";
import { useClassesRole } from "./classesRole";
import type {
  YTTCourse,
  ClassLevel,
  YTTCourseBody,
  YTTLiveClass,
  YTTLiveClassBody,
  ClassDifficulty,
  Tutor,
} from "../../../api/types";

type DerivedStatus = "LIVE" | "SCHEDULED" | "COMPLETED" | "UNSCHEDULED";

function deriveStatus(c: YTTLiveClass): DerivedStatus {
  if (c.startedAt && !c.endedAt) return "LIVE";
  if (c.endedAt) return "COMPLETED";
  if (c.scheduledAt) return "SCHEDULED";
  return "UNSCHEDULED";
}

const STATUS_TONE: Record<DerivedStatus, string> = {
  LIVE: "bg-red-50 text-red-700 border-red-200",
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  UNSCHEDULED: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_LABEL: Record<DerivedStatus, string> = {
  LIVE: "Live",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  UNSCHEDULED: "Unscheduled",
};

const BRAND = "#610981";

const LEVELS: { value: ClassLevel; label: string }[] = [
  { value: "ALL_LEVELS", label: "All Levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const DIFFICULTIES: { value: ClassDifficulty; label: string }[] = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

function formatDuration(minutes: number) {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function formatScheduled(iso: string | null) {
  if (!iso) return "Not scheduled";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ISO ↔ datetime-local helpers (HTML input gives "YYYY-MM-DDTHH:MM" in local TZ)
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// ─── COURSE FORM DIALOG (Create + Edit) ───────────────────────────────────────

interface CourseFormDialogProps {
  open: boolean;
  initial: YTTCourse | null;
  onClose: () => void;
  onSaved: (course: YTTCourse) => void;
}

const EMPTY_COURSE: YTTCourseBody = {
  title: "",
  yogaType: "",
  description: "",
  thumbnail: "",
  level: "ALL_LEVELS",
  isActive: true,
};

function CourseFormDialog({ open, initial, onClose, onSaved }: CourseFormDialogProps) {
  const role = useClassesRole();
  const [form, setForm] = useState<YTTCourseBody>(EMPTY_COURSE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        title: initial.title,
        yogaType: initial.yogaType,
        description: initial.description ?? "",
        thumbnail: initial.thumbnail ?? "",
        level: initial.level as ClassLevel,
        isActive: initial.isActive,
      } : EMPTY_COURSE);
    }
  }, [open, initial]);

  function set<K extends keyof YTTCourseBody>(key: K, value: YTTCourseBody[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.title.trim() || !form.yogaType.trim()) {
      toast.error("Title and yoga type are required");
      return;
    }
    setSaving(true);
    try {
      const payload: YTTCourseBody = {
        title: form.title.trim(),
        yogaType: form.yogaType.trim(),
        ...(form.description?.trim() ? { description: form.description.trim() } : {}),
        ...(form.thumbnail?.trim() ? { thumbnail: form.thumbnail.trim() } : {}),
        level: form.level,
        isActive: form.isActive,
      };
      const saved = initial
        ? await updateYTTLiveCourse(initial.id, payload, role)
        : await createYTTLiveCourse(payload, role);
      toast.success(initial ? "Course updated" : "Course created");
      onSaved(saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save course");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Course" : "New Course"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update YTT Live course details" : "Create a new YTT Live course"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="course-title">Title *</Label>
            <Input
              id="course-title"
              placeholder="e.g. 200-Hour Hatha Live Training"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="course-yoga">Yoga Type *</Label>
              <Input
                id="course-yoga"
                placeholder="e.g. Hatha"
                value={form.yogaType}
                onChange={(e) => set("yogaType", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Level</Label>
              <Select value={form.level} onValueChange={(v) => set("level", v as ClassLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="course-desc">Description</Label>
            <Input
              id="course-desc"
              placeholder="Optional course description"
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="course-thumb">Thumbnail URL</Label>
            <Input
              id="course-thumb"
              placeholder="https://…"
              value={form.thumbnail ?? ""}
              onChange={(e) => set("thumbnail", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <Label className="font-normal">Active</Label>
            <input
              type="checkbox"
              id="course-active"
              checked={!!form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="sr-only peer"
            />
            <label
              htmlFor="course-active"
              className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-muted peer-checked:bg-primary transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button disabled={saving} onClick={handleSave} style={{ background: BRAND }}>
            {saving ? "Saving…" : initial ? "Save Changes" : "Create Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── CLASS FORM DIALOG (Create + Edit) ────────────────────────────────────────

interface ClassFormDialogProps {
  open: boolean;
  courseId: string;
  initial: YTTLiveClass | null;
  onClose: () => void;
  onSaved: (cls: YTTLiveClass) => void;
}

type ClassFormState = {
  title: string;
  yogaType: string;
  difficulty: ClassDifficulty;
  duration: string;
  description: string;
  link: string;
  scheduledAt: string;
  recording: string;
  tutorId: string;
};

const EMPTY_CLASS: ClassFormState = {
  title: "",
  yogaType: "",
  difficulty: "EASY",
  duration: "",
  description: "",
  link: "",
  scheduledAt: "",
  recording: "",
  tutorId: "",
};

const NO_TUTOR = "__none__";

function ClassFormDialog({ open, courseId, initial, onClose, onSaved }: ClassFormDialogProps) {
  const role = useClassesRole();
  const [form, setForm] = useState<ClassFormState>(EMPTY_CLASS);
  const [saving, setSaving] = useState(false);
  const [tutors, setTutors] = useState<Tutor[]>([]);

  useEffect(() => {
    if (!open) return;
    listTutors(role, { limit: 100, status: "ACTIVE" })
      .then((r) => setTutors(r.items))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        title: initial.title,
        yogaType: initial.yogaType,
        difficulty: initial.difficulty,
        duration: String(initial.duration ?? ""),
        description: initial.description ?? "",
        link: initial.link ?? "",
        scheduledAt: isoToLocalInput(initial.scheduledAt),
        recording: initial.recording ?? "",
        tutorId: initial.tutor?.id ?? initial.tutorId ?? "",
      });
    } else {
      setForm(EMPTY_CLASS);
    }
  }, [open, initial]);

  function set<K extends keyof ClassFormState>(key: K, value: ClassFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    const duration = Number(form.duration);
    if (!form.title.trim() || !form.yogaType.trim()) {
      toast.error("Title and yoga type are required");
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      toast.error("Duration must be a positive number");
      return;
    }
    setSaving(true);
    try {
      const scheduledIso = localInputToIso(form.scheduledAt);
      const create: YTTLiveClassBody = {
        title: form.title.trim(),
        yogaType: form.yogaType.trim(),
        difficulty: form.difficulty,
        duration,
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        ...(form.link.trim() ? { link: form.link.trim() } : {}),
        ...(scheduledIso ? { scheduledAt: scheduledIso } : {}),
        ...(form.recording.trim() ? { recording: form.recording.trim() } : {}),
        ...(form.tutorId ? { tutorId: form.tutorId } : {}),
      };
      // For PATCH, send nullable fields explicitly so they can be cleared.
      const patch: Partial<YTTLiveClassBody> = {
        title: create.title,
        yogaType: create.yogaType,
        difficulty: create.difficulty,
        duration,
        description: form.description.trim() ? form.description.trim() : null,
        link: form.link.trim() ? form.link.trim() : null,
        scheduledAt: scheduledIso,
        recording: form.recording.trim() ? form.recording.trim() : null,
        tutorId: form.tutorId || null,
      };
      const saved = initial
        ? await updateYTTLiveClass(courseId, initial.id, patch, role)
        : await createYTTLiveClass(courseId, create, role);
      toast.success(initial ? "Class updated" : "Class created");
      onSaved(saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save class");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Class" : "New Live Class"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update live session details" : "Schedule a new live session for this course"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="cls-title">Title *</Label>
            <Input
              id="cls-title"
              placeholder="e.g. Week 1 — Sun Salutations Lab"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cls-yoga">Yoga Type *</Label>
              <Input
                id="cls-yoga"
                placeholder="Hatha"
                value={form.yogaType}
                onChange={(e) => set("yogaType", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cls-duration">Duration (min) *</Label>
              <Input
                id="cls-duration"
                type="number"
                min={1}
                placeholder="60"
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Difficulty</Label>
            <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v as ClassDifficulty)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="cls-scheduled">Scheduled at</Label>
            <Input
              id="cls-scheduled"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => set("scheduledAt", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Tutor</Label>
            <Select
              value={form.tutorId || NO_TUTOR}
              onValueChange={(v) => set("tutorId", v === NO_TUTOR ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign a tutor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TUTOR}>No tutor</SelectItem>
                {tutors.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground">· {t.tutorId}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The assigned tutor will see this session in their tutor panel.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="cls-link">Live join URL</Label>
            <Input
              id="cls-link"
              placeholder="https://meet.google.com/…"
              value={form.link}
              onChange={(e) => set("link", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cls-recording">Recording URL</Label>
            <Input
              id="cls-recording"
              placeholder="https://…"
              value={form.recording}
              onChange={(e) => set("recording", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cls-desc">Description</Label>
            <Textarea
              id="cls-desc"
              placeholder="What this session covers"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button disabled={saving} onClick={handleSave} style={{ background: BRAND }}>
            {saving ? "Saving…" : initial ? "Save Changes" : "Create Class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── CLASS LIST INSIDE COURSE DETAIL ──────────────────────────────────────────

interface CourseClassesProps {
  courseId: string;
}

function CourseClasses({ courseId }: CourseClassesProps) {
  const role = useClassesRole();
  const [classes, setClasses] = useState<YTTLiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<YTTLiveClass | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listYTTLiveClasses(courseId, {
      q: debouncedSearch || undefined,
    }, role)
      .then((items) => { if (!cancelled) setClasses(items); })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load classes");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseId, debouncedSearch]);

  function handleSaved(saved: YTTLiveClass) {
    setClasses((cs) => {
      const idx = cs.findIndex((c) => c.id === saved.id);
      if (idx === -1) return [saved, ...cs];
      const next = cs.slice();
      next[idx] = saved;
      return next;
    });
    setFormOpen(false);
    setEditing(null);
  }

  async function handleDelete(cls: YTTLiveClass) {
    if (!confirm(`Delete class "${cls.title}"? This cannot be undone.`)) return;
    try {
      await deleteYTTLiveClass(courseId, cls.id, role);
      toast.success("Class deleted");
      setClasses((cs) => cs.filter((c) => c.id !== cls.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete class");
    }
  }

  const isEmpty = !loading && classes.length === 0;
  const isFiltered = !!debouncedSearch;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base">Live Sessions</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title…"
                className="pl-9 h-9 w-full sm:w-56"
              />
            </div>
            <Button
              size="sm"
              className="h-9 gap-1.5"
              style={{ background: BRAND }}
              onClick={() => { setEditing(null); setFormOpen(true); }}
            >
              <Plus className="w-4 h-4" />
              New Class
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading classes…</div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border/60 gap-2 text-center px-6">
            <Radio className="w-8 h-8 text-[#610981]/25" />
            <p className="text-sm font-medium text-muted-foreground">
              {isFiltered ? "No classes match your filters" : "No classes scheduled yet"}
            </p>
            {!isFiltered && (
              <Button
                size="sm"
                className="mt-2 gap-1.5"
                style={{ background: BRAND }}
                onClick={() => { setEditing(null); setFormOpen(true); }}
              >
                <Plus className="w-3.5 h-3.5" />
                Schedule first class
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 rounded-lg border border-border/60 hover:border-[#610981]/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{cls.title}</p>
                    {(() => {
                      const s = deriveStatus(cls);
                      return (
                        <Badge variant="outline" className={STATUS_TONE[s]}>
                          {STATUS_LABEL[s]}
                        </Badge>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    <span className="capitalize">{cls.yogaType} · {cls.difficulty.toLowerCase()}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(cls.duration)}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" />{formatScheduled(cls.scheduledAt)}</span>
                    {cls.tutor && (
                      <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />{cls.tutor.name}</span>
                    )}
                    {cls.link && (
                      <a
                        href={cls.link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-[#610981] hover:underline"
                      >
                        <Link2 className="w-3 h-3" />Join link
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => { setEditing(cls); setFormOpen(true); }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(cls)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ClassFormDialog
        open={formOpen}
        courseId={courseId}
        initial={editing}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={handleSaved}
      />
    </Card>
  );
}

// ─── COURSE DETAIL PANEL ──────────────────────────────────────────────────────

interface CourseDetailProps {
  course: YTTCourse;
  onBack: () => void;
  onEdit: () => void;
}

function CourseDetail({ course, onBack, onEdit }: CourseDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground px-2">
          <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold truncate" style={{ color: BRAND }}>{course.title}</h2>
          <p className="text-xs text-muted-foreground capitalize">
            {course.level.toLowerCase().replace(/_/g, " ")} · {course.yogaType}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onEdit} className="gap-1">
          <Pencil className="w-3.5 h-3.5" />Edit
        </Button>
      </div>

      {course.description && (
        <Card>
          <CardContent className="pt-4 text-sm text-muted-foreground">{course.description}</CardContent>
        </Card>
      )}

      <CourseClasses courseId={course.id} />

      <p className="text-xs text-muted-foreground text-center">
        Plans for this course are managed under <span className="font-medium">Plans → YTT Live</span>.
      </p>
    </div>
  );
}

// ─── COURSE CARD ──────────────────────────────────────────────────────────────

interface CourseCardProps {
  course: YTTCourse;
  onSelect: () => void;
  onEdit: () => void;
}

function CourseCard({ course, onSelect, onEdit }: CourseCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${BRAND}15` }}>
            <Radio className="w-5 h-5" style={{ color: BRAND }} />
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={course.isActive ? "default" : "secondary"} className="shrink-0">
              {course.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-base leading-snug mt-2 cursor-pointer" onClick={onSelect}>{course.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {course.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground capitalize">
            {course.level.toLowerCase().replace(/_/g, " ")} · {course.yogaType}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs group-hover:border-[#610981] group-hover:text-[#610981] transition-colors"
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              View
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export function ClassesYTTLive() {
  const role = useClassesRole();
  const [courses, setCourses] = useState<YTTCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<YTTCourse | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<YTTCourse | null>(null);

  function load() {
    setLoading(true);
    listYTTLiveCourses(role)
      .then(setCourses)
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to load courses"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(course: YTTCourse) {
    setEditing(course);
    setFormOpen(true);
  }

  function handleSaved(saved: YTTCourse) {
    setCourses((cs) => {
      const idx = cs.findIndex((c) => c.id === saved.id);
      if (idx === -1) return [saved, ...cs];
      const next = cs.slice();
      next[idx] = saved;
      return next;
    });
    if (selected?.id === saved.id) setSelected(saved);
    setFormOpen(false);
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: BRAND }}>YTT Live</h1>
          <p className="text-muted-foreground text-sm mt-1">Yoga Teacher Training — live batch courses</p>
        </div>
        {/* {!selected && (
          <Button onClick={openCreate} className="gap-2 shrink-0" style={{ background: BRAND }}>
            <Plus className="w-4 h-4" />
            New Course
          </Button>
        )} */}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading courses…</div>
      )}

      {!loading && !selected && (
        <>
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border/60">
              <GraduationCap className="w-12 h-12 mb-4 text-[#610981]/30" />
              <p className="text-sm text-muted-foreground">No courses yet</p>
              <Button size="sm" className="mt-4 gap-1.5" onClick={openCreate} style={{ background: BRAND }}>
                <Plus className="w-3.5 h-3.5" />
                Create your first course
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onSelect={() => setSelected(course)}
                  onEdit={() => openEdit(course)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!loading && selected && (
        <CourseDetail
          course={selected}
          onBack={() => setSelected(null)}
          onEdit={() => openEdit(selected)}
        />
      )}

      <CourseFormDialog
        open={formOpen}
        initial={editing}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={handleSaved}
      />
    </div>
  );
}
