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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";
import { Video, Plus, Pencil, Trash2, ChevronRight, FolderOpen, Clock, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import {
  listYTTRecordedCourses,
  getYTTRecordedCourse,
  createYTTRecordedModule,
  deleteYTTRecordedModule,
  createYTTRecordedClass,
  updateYTTRecordedClass,
  deleteYTTRecordedClass,
  reorderYTTRecordedModules,
  reorderYTTRecordedClasses,
} from "../../../api/plans";
import type { YTTCourse, YTTCourseDetail, YTTModule, YTTClass } from "../../../api/types";

const BRAND = "#610981";

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// ─── ADD MODULE DIALOG ────────────────────────────────────────────────────────

interface AddModuleDialogProps {
  open: boolean;
  courseId: string;
  onClose: () => void;
  onCreated: (mod: YTTModule) => void;
}

function AddModuleDialog({ open, courseId, onClose, onCreated }: AddModuleDialogProps) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle("");
    setSaving(false);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const mod = await createYTTRecordedModule(courseId, { title: title.trim() });
      toast.success("Module created");
      onCreated(mod);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create module");
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Module</DialogTitle>
          <DialogDescription>Group classes under a module (e.g. "Week 1", "Foundation").</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="mod-title">Module Title *</Label>
            <Input
              id="mod-title"
              placeholder="e.g. Week 1 – Foundations"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button disabled={!title.trim() || saving} onClick={handleSave} style={{ background: BRAND }}>
            {saving ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ADD CLASS DIALOG ─────────────────────────────────────────────────────────

interface AddClassDialogProps {
  open: boolean;
  courseId: string;
  moduleId: string;
  moduleName: string;
  onClose: () => void;
  onCreated: () => void;
}

const EMPTY_CLASS = { title: "", video: "", duration: "", description: "" };

function AddClassDialog({ open, courseId, moduleId, moduleName, onClose, onCreated }: AddClassDialogProps) {
  const [form, setForm] = useState(EMPTY_CLASS);
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm(EMPTY_CLASS);
    setSaving(false);
  }

  function set(field: keyof typeof EMPTY_CLASS, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    const dur = Number(form.duration);
    if (!form.title.trim() || !form.video.trim() || !form.duration || isNaN(dur) || dur <= 0) return;
    setSaving(true);
    try {
      await createYTTRecordedClass(courseId, moduleId, {
        title: form.title.trim(),
        video: form.video.trim(),
        duration: dur,
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      });
      toast.success("Class added");
      onCreated();
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add class");
      setSaving(false);
    }
  }

  const valid = form.title.trim() && form.video.trim() && Number(form.duration) > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Class</DialogTitle>
          <DialogDescription>Adding to module: <span className="font-medium">{moduleName}</span></DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="cls-title">Title *</Label>
            <Input id="cls-title" placeholder="e.g. Introduction to Pranayama" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cls-url">Video URL *</Label>
            <Input id="cls-url" placeholder="https://…" value={form.video} onChange={(e) => set("video", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cls-dur">Duration (minutes) *</Label>
            <Input id="cls-dur" type="number" min="1" placeholder="60" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cls-desc">Description</Label>
            <Input id="cls-desc" placeholder="Optional description" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button disabled={!valid || saving} onClick={handleSave} style={{ background: BRAND }}>
            {saving ? "Adding…" : "Add Class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── EDIT CLASS DIALOG ────────────────────────────────────────────────────────

interface EditClassDialogProps {
  open: boolean;
  courseId: string;
  moduleId: string;
  moduleName: string;
  cls: YTTClass;
  onClose: () => void;
  onUpdated: (updated: YTTClass) => void;
}

function EditClassDialog({ open, courseId, moduleId, moduleName, cls, onClose, onUpdated }: EditClassDialogProps) {
  const [form, setForm] = useState({
    title: cls.title,
    video: cls.video,
    duration: String(cls.duration),
    description: cls.description ?? "",
  });
  const [saving, setSaving] = useState(false);

  // Reset the form when the target class changes (e.g. user opens edit on a different class).
  useEffect(() => {
    setForm({
      title: cls.title,
      video: cls.video,
      duration: String(cls.duration),
      description: cls.description ?? "",
    });
    setSaving(false);
  }, [cls.id]);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const valid = form.title.trim() && form.video.trim() && Number(form.duration) > 0;

  async function handleSave() {
    if (!valid) return;
    setSaving(true);
    try {
      const dur = Number(form.duration);
      const trimmedDesc = form.description.trim();
      const updated = await updateYTTRecordedClass(courseId, moduleId, cls.id, {
        title: form.title.trim(),
        video: form.video.trim(),
        duration: dur,
        description: trimmedDesc.length > 0 ? trimmedDesc : undefined,
      });
      toast.success("Class updated");
      onUpdated(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update class");
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
          <DialogDescription>Editing in module: <span className="font-medium">{moduleName}</span></DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="edit-cls-title">Title *</Label>
            <Input id="edit-cls-title" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-cls-url">Video URL *</Label>
            <Input id="edit-cls-url" placeholder="https://…" value={form.video} onChange={(e) => set("video", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-cls-dur">Duration (minutes) *</Label>
            <Input id="edit-cls-dur" type="number" min="1" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-cls-desc">Description</Label>
            <Input id="edit-cls-desc" placeholder="Optional description" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid || saving} onClick={handleSave} style={{ background: BRAND }}>
            {saving ? "Saving…" : "Save Changes"}
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
}

function CourseDetail({ course, onBack }: CourseDetailProps) {
  const [detail, setDetail] = useState<YTTCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [addClassFor, setAddClassFor] = useState<YTTModule | null>(null);
  const [editingClass, setEditingClass] = useState<{ mod: YTTModule; cls: YTTClass } | null>(null);
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  async function loadDetail() {
    try {
      const d = await getYTTRecordedCourse(course.id);
      setDetail(d);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDetail(); }, [course.id]);

  async function handleDeleteModule(mod: YTTModule) {
    if (!confirm(`Delete module "${mod.title}" and all its classes?`)) return;
    setDeletingModuleId(mod.id);
    try {
      await deleteYTTRecordedModule(course.id, mod.id);
      toast.success("Module deleted");
      setDetail((d) => d ? { ...d, modules: d.modules.filter((m) => m.id !== mod.id) } : d);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete module");
    } finally {
      setDeletingModuleId(null);
    }
  }

  async function handleDeleteClass(mod: YTTModule, classId: string, classTitle: string) {
    if (!confirm(`Delete class "${classTitle}"?`)) return;
    setDeletingClassId(classId);
    try {
      await deleteYTTRecordedClass(course.id, mod.id, classId);
      toast.success("Class deleted");
      setDetail((d) => {
        if (!d) return d;
        return {
          ...d,
          modules: d.modules.map((m) =>
            m.id === mod.id ? { ...m, classes: m.classes.filter((c) => c.id !== classId) } : m
          ),
        };
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete class");
    } finally {
      setDeletingClassId(null);
    }
  }

  async function moveModule(index: number, direction: "up" | "down") {
    if (!detail || isReordering) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= detail.modules.length) return;

    const previous = detail.modules;
    const reordered = [...previous];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    setDetail({ ...detail, modules: reordered });
    setIsReordering(true);
    try {
      await reorderYTTRecordedModules(
        course.id,
        reordered.map((m, i) => ({ id: m.id, sortOrder: i + 1 })),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reorder modules");
      setDetail((d) => (d ? { ...d, modules: previous } : d));
    } finally {
      setIsReordering(false);
    }
  }

  async function moveClass(mod: YTTModule, index: number, direction: "up" | "down") {
    if (!detail || isReordering) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= mod.classes.length) return;

    const previousClasses = mod.classes;
    const reorderedClasses = [...previousClasses];
    [reorderedClasses[index], reorderedClasses[swapIndex]] = [
      reorderedClasses[swapIndex],
      reorderedClasses[index],
    ];
    setDetail({
      ...detail,
      modules: detail.modules.map((m) =>
        m.id === mod.id ? { ...m, classes: reorderedClasses } : m,
      ),
    });
    setIsReordering(true);
    try {
      await reorderYTTRecordedClasses(
        course.id,
        mod.id,
        reorderedClasses.map((c, i) => ({ id: c.id, sortOrder: i + 1 })),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reorder classes");
      setDetail((d) =>
        d
          ? {
              ...d,
              modules: d.modules.map((m) =>
                m.id === mod.id ? { ...m, classes: previousClasses } : m,
              ),
            }
          : d,
      );
    } finally {
      setIsReordering(false);
    }
  }

  const totalClasses = detail?.modules.reduce((acc, m) => acc + m.classes.length, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground px-2">
          <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: BRAND }}>{course.title}</h2>
          <p className="text-xs text-muted-foreground">{totalClasses} class{totalClasses !== 1 ? "es" : ""} across {detail?.modules.length ?? 0} module{(detail?.modules.length ?? 0) !== 1 ? "s" : ""}</p>
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setAddModuleOpen(true)} style={{ background: BRAND }}>
            <Plus className="w-4 h-4 mr-1" />
            Add Module
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading…</div>
      )}

      {!loading && detail?.modules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border/60 gap-3">
          <FolderOpen className="w-10 h-10 text-[#610981]/25" />
          <p className="text-sm text-muted-foreground">No modules yet. Add a module to start organising classes.</p>
          <Button size="sm" onClick={() => setAddModuleOpen(true)} style={{ background: BRAND }}>
            <Plus className="w-4 h-4 mr-1" />
            Add Module
          </Button>
        </div>
      )}

      {!loading && detail && detail.modules.length > 0 && (
        <Accordion type="multiple" defaultValue={detail.modules.map((m) => m.id)} className="space-y-3">
          {detail.modules.map((mod, modIdx) => (
            <AccordionItem
              key={mod.id}
              value={mod.id}
              className="border rounded-xl overflow-hidden"
            >
              <div className="flex items-center">
                <AccordionTrigger className="px-4 py-3 flex-1 hover:no-underline hover:bg-muted/30">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{modIdx + 1}.</span>
                    <FolderOpen className="w-4 h-4 shrink-0" style={{ color: BRAND }} />
                    <span className="font-medium text-sm truncate">{mod.title}</span>
                    <Badge variant="secondary" className="ml-1 shrink-0">{mod.classes.length} class{mod.classes.length !== 1 ? "es" : ""}</Badge>
                  </div>
                </AccordionTrigger>
                <div className="flex items-center gap-0.5 pr-3 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={modIdx === 0 || isReordering}
                    onClick={(e) => { e.stopPropagation(); moveModule(modIdx, "up"); }}
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={modIdx === detail.modules.length - 1 || isReordering}
                    onClick={(e) => { e.stopPropagation(); moveModule(modIdx, "down"); }}
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="space-y-2">
                  {mod.classes.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">No classes in this module yet.</p>
                  )}
                  {mod.classes.map((cls, idx) => (
                    <div key={cls.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30">
                      <span className="text-xs text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                      <Video className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{cls.title}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />{formatDuration(cls.duration)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6"
                        disabled={idx === 0 || isReordering}
                        onClick={() => moveClass(mod, idx, "up")}
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6"
                        disabled={idx === mod.classes.length - 1 || isReordering}
                        onClick={() => moveClass(mod, idx, "down")}
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6"
                        onClick={() => setEditingClass({ mod, cls })}
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6 text-destructive hover:text-destructive"
                        disabled={deletingClassId === cls.id}
                        onClick={() => handleDeleteClass(mod, cls.id, cls.title)}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setAddClassFor(mod)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Class
                    </Button>
                    {mod.classes.length === 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive ml-auto"
                        disabled={deletingModuleId === mod.id}
                        onClick={() => handleDeleteModule(mod)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete Module
                      </Button>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <AddModuleDialog
        open={addModuleOpen}
        courseId={course.id}
        onClose={() => setAddModuleOpen(false)}
        onCreated={(mod) => {
          setDetail((d) => d ? { ...d, modules: [...d.modules, { ...mod, classes: [] }] } : d);
          setAddModuleOpen(false);
        }}
      />

      {addClassFor && (
        <AddClassDialog
          open={!!addClassFor}
          courseId={course.id}
          moduleId={addClassFor.id}
          moduleName={addClassFor.title}
          onClose={() => setAddClassFor(null)}
          onCreated={() => {
            setAddClassFor(null);
            loadDetail();
          }}
        />
      )}

      {editingClass && (
        <EditClassDialog
          open={!!editingClass}
          courseId={course.id}
          moduleId={editingClass.mod.id}
          moduleName={editingClass.mod.title}
          cls={editingClass.cls}
          onClose={() => setEditingClass(null)}
          onUpdated={(updated) => {
            const targetModuleId = editingClass.mod.id;
            setDetail((d) => {
              if (!d) return d;
              return {
                ...d,
                modules: d.modules.map((m) =>
                  m.id === targetModuleId
                    ? { ...m, classes: m.classes.map((c) => (c.id === updated.id ? updated : c)) }
                    : m,
                ),
              };
            });
            setEditingClass(null);
          }}
        />
      )}
    </div>
  );
}

// ─── COURSE CARD ──────────────────────────────────────────────────────────────

interface CourseCardProps {
  course: YTTCourse;
  onSelect: () => void;
}

function CourseCard({ course, onSelect }: CourseCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${BRAND}15` }}>
            <Video className="w-5 h-5" style={{ color: BRAND }} />
          </div>
          <Badge variant={course.isActive ? "default" : "secondary"} className="shrink-0">
            {course.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <CardTitle className="text-base leading-snug mt-2">{course.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {course.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground capitalize">{course.level.toLowerCase().replace(/_/g, " ")} · {course.yogaType}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs group-hover:border-[#610981] group-hover:text-[#610981] transition-colors"
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            Manage Classes
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export function ClassesYTTRecorded() {
  const [courses, setCourses] = useState<YTTCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<YTTCourse | null>(null);

  useEffect(() => {
    listYTTRecordedCourses()
      .then(setCourses)
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to load courses"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: BRAND }}>YTT Recorded</h1>
        <p className="text-muted-foreground text-sm mt-1">Yoga Teacher Training — recorded sessions</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading courses…</div>
      )}

      {!loading && !selected && (
        <>
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border/60">
              <Video className="w-12 h-12 mb-4 text-[#610981]/30" />
              <p className="text-sm text-muted-foreground">No courses found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} onSelect={() => setSelected(course)} />
              ))}
            </div>
          )}
        </>
      )}

      {!loading && selected && (
        <CourseDetail course={selected} onBack={() => setSelected(null)} />
      )}
    </div>
  );
}
