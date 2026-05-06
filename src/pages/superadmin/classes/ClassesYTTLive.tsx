import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
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
import { Radio, Plus, Trash2, ChevronRight, GraduationCap, Pencil, Clock, IndianRupee, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  listYTTLiveCourses,
  getYTTLiveCourse,
  createYTTLiveCourse,
  updateYTTLiveCourse,
  deleteYTTLiveCourse,
} from "../../../api/plans";
import type { YTTCourse, YTTLiveCourseDetail, ClassLevel, YTTCourseBody } from "../../../api/types";

const BRAND = "#610981";

const LEVELS: { value: ClassLevel; label: string }[] = [
  { value: "ALL_LEVELS", label: "All Levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const formatINR = (val: string | number) => `₹${Number(val).toLocaleString("en-IN")}`;

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
  thumbnailUrl: "",
  level: "ALL_LEVELS",
  isActive: true,
};

function CourseFormDialog({ open, initial, onClose, onSaved }: CourseFormDialogProps) {
  const [form, setForm] = useState<YTTCourseBody>(EMPTY_COURSE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        title: initial.title,
        yogaType: initial.yogaType,
        description: initial.description ?? "",
        thumbnailUrl: initial.thumbnailUrl ?? "",
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
        ...(form.thumbnailUrl?.trim() ? { thumbnailUrl: form.thumbnailUrl.trim() } : {}),
        level: form.level,
        isActive: form.isActive,
      };
      const saved = initial
        ? await updateYTTLiveCourse(initial.id, payload)
        : await createYTTLiveCourse(payload);
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
              value={form.thumbnailUrl ?? ""}
              onChange={(e) => set("thumbnailUrl", e.target.value)}
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

// ─── COURSE DETAIL PANEL ──────────────────────────────────────────────────────

interface CourseDetailProps {
  course: YTTCourse;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function CourseDetail({ course, onBack, onEdit, onDelete }: CourseDetailProps) {
  const [detail, setDetail] = useState<YTTLiveCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getYTTLiveCourse(course.id)
      .then(setDetail)
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to load course"))
      .finally(() => setLoading(false));
  }, [course.id]);

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
        <Button size="sm" variant="outline" onClick={onDelete} className="gap-1 text-destructive hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />Delete
        </Button>
      </div>

      {course.description && (
        <Card>
          <CardContent className="pt-4 text-sm text-muted-foreground">{course.description}</CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Plans</h3>
          <span className="text-xs text-muted-foreground">Manage in Plans → YTT Live</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading…</div>
        ) : !detail || detail.plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-border/60 gap-2">
            <IndianRupee className="w-8 h-8 text-[#610981]/25" />
            <p className="text-sm text-muted-foreground">No plans linked to this course yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {detail.plans.map((plan) => (
              <div key={plan.id} className={`p-3 border rounded-xl space-y-2 ${!plan.isActive ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm leading-tight">{plan.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3" />{plan.validity} days
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">{formatINR(plan.price)}</p>
                    {plan.originalPrice && (
                      <p className="text-xs text-muted-foreground line-through">{formatINR(plan.originalPrice)}</p>
                    )}
                  </div>
                </div>
                {plan.features.length > 0 && (
                  <ul className="space-y-0.5">
                    {plan.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                )}
                {!plan.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COURSE CARD ──────────────────────────────────────────────────────────────

interface CourseCardProps {
  course: YTTCourse;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function CourseCard({ course, onSelect, onEdit, onDelete }: CourseCardProps) {
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
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="w-3.5 h-3.5" />
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
  const [courses, setCourses] = useState<YTTCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<YTTCourse | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<YTTCourse | null>(null);

  function load() {
    setLoading(true);
    listYTTLiveCourses()
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

  async function handleDelete(course: YTTCourse) {
    if (!confirm(`Delete course "${course.title}"? This cannot be undone.`)) return;
    try {
      await deleteYTTLiveCourse(course.id);
      toast.success("Course deleted");
      setCourses((cs) => cs.filter((c) => c.id !== course.id));
      if (selected?.id === course.id) setSelected(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete course");
    }
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
        {!selected && (
          <Button onClick={openCreate} className="gap-2 shrink-0" style={{ background: BRAND }}>
            <Plus className="w-4 h-4" />
            New Course
          </Button>
        )}
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
                  onDelete={() => handleDelete(course)}
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
          onDelete={() => handleDelete(selected)}
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
