import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  User,
  Clock,
  CalendarDays,
  Layers,
  Loader2,
  RefreshCw,
  Pause,
  Play,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/components/ui/utils";
import {
  listLiveClasses,
  updateLiveClass,
  deleteLiveClass,
  listRecurringLiveClasses,
  createRecurringLiveClass,
  updateRecurringLiveClass,
  deleteRecurringLiveClass,
} from "@/api/live";
import { listTutors } from "@/api/tutors";
import { listBatches } from "@/api/batches";
import { toDatetimeLocalValue, formatISTDateTimeYear } from "@/lib/datetime";
import type {
  LiveClass,
  ClassDifficulty,
  Tutor,
  Batch,
  RecurringLiveClass,
  DayOfWeek,
} from "@/api/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<ClassDifficulty, { label: string; color: string }> = {
  EASY: { label: "Beginner", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  MEDIUM: { label: "Intermediate", color: "bg-amber-50 text-amber-700 border-amber-200" },
  HARD: { label: "Advanced", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

const ALL_DAYS: { value: DayOfWeek; label: string; full: string }[] = [
  { value: "MON", label: "Mon", full: "Monday" },
  { value: "TUE", label: "Tue", full: "Tuesday" },
  { value: "WED", label: "Wed", full: "Wednesday" },
  { value: "THU", label: "Thu", full: "Thursday" },
  { value: "FRI", label: "Fri", full: "Friday" },
  { value: "SAT", label: "Sat", full: "Saturday" },
  { value: "SUN", label: "Sun", full: "Sunday" },
];

const DAY_FULL: Record<string, string> = Object.fromEntries(
  ALL_DAYS.map((d) => [d.value, d.full]),
);

const BLANK_RECURRING_FORM = {
  title: "",
  yogaType: "",
  difficulty: "" as ClassDifficulty | "",
  duration: "",
  description: "",
  tutorId: "",
  batchId: "",
  daysOfWeek: [] as DayOfWeek[],
  timeOfDay: "",
  startDate: "",
  endDate: "",
};

type RecurringFormState = typeof BLANK_RECURRING_FORM;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSchedule(iso: string | null) {
  if (!iso) return null;
  return formatISTDateTimeYear(iso);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDays(days: DayOfWeek[]) {
  return days.map((d) => ALL_DAYS.find((x) => x.value === d)?.label ?? d).join(", ");
}

// ─── Main Page Component ──────────────────────────────────────────────────────

interface ClassesLiveRecurringProps {
  role?: "SUPERADMIN" | "OPERATIONS";
}

export function ClassesLiveRecurring({ role = "SUPERADMIN" }: ClassesLiveRecurringProps) {
  const [templates, setTemplates] = useState<RecurringLiveClass[]>([]);
  const [generatedClasses, setGeneratedClasses] = useState<LiveClass[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Template dialog state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringLiveClass | null>(null);
  const [form, setForm] = useState<RecurringFormState>(BLANK_RECURRING_FORM);
  const [saving, setSaving] = useState(false);

  // Template delete
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<RecurringLiveClass | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  // Generated class edit/delete
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null);
  const [deleteClassTarget, setDeleteClassTarget] = useState<LiveClass | null>(null);
  const [deletingClass, setDeletingClass] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tmplList, classList] = await Promise.all([
        listRecurringLiveClasses(role),
        listLiveClasses(role, { limit: 100 }),
      ]);
      setTemplates(tmplList);
      setGeneratedClasses(classList.items.filter((c) => c.recurringId !== null));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
    listTutors(role, { limit: 100, status: "ACTIVE" })
      .then((r) => setTutors(r.items))
      .catch(() => {});
    listBatches(role, { limit: 100 })
      .then((r) => setBatches(r.items))
      .catch(() => {});
  }, [load, role]);

  // ─── Template CRUD ───────────────────────────────────────────────────────────

  function openCreateTemplate() {
    setEditingTemplate(null);
    setForm(BLANK_RECURRING_FORM);
    setTemplateDialogOpen(true);
  }

  function openEditTemplate(t: RecurringLiveClass) {
    setEditingTemplate(t);
    setForm({
      title: t.title,
      yogaType: t.yogaType,
      difficulty: t.difficulty,
      duration: String(t.duration),
      description: t.description ?? "",
      tutorId: t.tutor?.id ?? "",
      batchId: t.batch?.id ?? "",
      daysOfWeek: [...t.daysOfWeek],
      timeOfDay: t.timeOfDay,
      startDate: t.startDate.slice(0, 10),
      endDate: t.endDate ? t.endDate.slice(0, 10) : "",
    });
    setTemplateDialogOpen(true);
  }

  function setField<K extends keyof RecurringFormState>(key: K, val: RecurringFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function toggleDay(day: DayOfWeek) {
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  }

  async function handleSaveTemplate() {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.yogaType.trim()) return toast.error("Yoga type is required");
    if (!form.difficulty) return toast.error("Difficulty is required");
    if (!form.duration || isNaN(Number(form.duration))) return toast.error("Valid duration is required");
    if (form.daysOfWeek.length === 0) return toast.error("Select at least one day");
    if (!form.timeOfDay) return toast.error("Class time is required");
    if (!form.startDate) return toast.error("Start date is required");

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        yogaType: form.yogaType.trim(),
        difficulty: form.difficulty as ClassDifficulty,
        duration: Number(form.duration),
        daysOfWeek: form.daysOfWeek,
        timeOfDay: form.timeOfDay,
        startDate: new Date(form.startDate).toISOString(),
        ...(form.description ? { description: form.description } : {}),
        ...(form.tutorId ? { tutorId: form.tutorId } : {}),
        ...(form.batchId ? { batchId: form.batchId } : {}),
        ...(form.endDate ? { endDate: new Date(form.endDate).toISOString() } : {}),
      };

      if (editingTemplate) {
        const updated = await updateRecurringLiveClass(role, editingTemplate.id, payload);
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        toast.success("Recurring template updated");
      } else {
        const created = await createRecurringLiveClass(role, payload);
        setTemplates((prev) => [created, ...prev]);
        toast.success("Recurring template created - classes will be generated at midnight");
      }
      setTemplateDialogOpen(false);
      // Reload generated classes after a short delay to catch any immediate generation
      setTimeout(() => {
        listLiveClasses(role, { limit: 100 })
          .then((list) => setGeneratedClasses(list.items.filter((c) => c.recurringId !== null)))
          .catch(() => {});
      }, 800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(t: RecurringLiveClass) {
    try {
      const updated = await updateRecurringLiveClass(role, t.id, { isActive: !t.isActive });
      setTemplates((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast.success(updated.isActive ? "Template activated" : "Template deactivated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  }

  async function handleDeleteTemplate() {
    if (!deleteTemplateTarget) return;
    setDeletingTemplate(true);
    try {
      await deleteRecurringLiveClass(role, deleteTemplateTarget.id);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTemplateTarget.id));
      toast.success("Recurring template deleted");
      setDeleteTemplateTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingTemplate(false);
    }
  }

  // ─── Generated class edit/delete ─────────────────────────────────────────────

  async function handleDeleteClass() {
    if (!deleteClassTarget) return;
    setDeletingClass(true);
    try {
      await deleteLiveClass(role, deleteClassTarget.id);
      setGeneratedClasses((prev) => prev.filter((c) => c.id !== deleteClassTarget.id));
      toast.success("Class deleted");
      setDeleteClassTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingClass(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#ff691d" }}>
            Recurring Live Classes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create schedules that auto-generate live classes every week
          </p>
        </div>
        <Button onClick={openCreateTemplate} className="gap-2 shrink-0" style={{ background: "#610981" }}>
          <Plus className="w-4 h-4" />
          New Recurring Class
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#610981]/40" />
        </div>
      ) : (
        <>
          {/* ── Section 1: Recurring Templates ───────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#610981]" />
              <h2 className="font-semibold text-sm text-foreground">
                Recurring Templates
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({templates.length})
                </span>
              </h2>
            </div>

            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-border/60">
                <RefreshCw className="w-10 h-10 mb-3 text-[#610981]/20" />
                <p className="text-sm text-muted-foreground">No recurring templates yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-1.5"
                  onClick={openCreateTemplate}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create first template
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {templates.map((t) => (
                  <RecurringTemplateCard
                    key={t.id}
                    template={t}
                    onEdit={() => openEditTemplate(t)}
                    onToggle={() => handleToggleActive(t)}
                    onDelete={() => setDeleteTemplateTarget(t)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Section 2: Generated Classes ─────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#610981]" />
              <h2 className="font-semibold text-sm text-foreground">
                Generated Classes
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({generatedClasses.length})
                </span>
              </h2>
            </div>

            {generatedClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-border/60">
                <Radio className="w-10 h-10 mb-3 text-[#610981]/20" />
                <p className="text-sm text-muted-foreground">
                  No generated classes yet - they appear here after the cron runs at midnight
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {generatedClasses.map((cls) => (
                  <GeneratedClassCard
                    key={cls.id}
                    cls={cls}
                    onEdit={() => setEditingClass(cls)}
                    onDelete={() => setDeleteClassTarget(cls)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ── Recurring Template Dialog (create / edit) ─────────────────────────── */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader className="min-w-0">
            <DialogTitle className="text-[#610981]">
              {editingTemplate ? "Edit Recurring Template" : "New Recurring Class"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Title */}
            <div className="space-y-1.5">
              <Label>
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Morning Vinyasa Flow"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                className="h-9 rounded-xl bg-input-background/50"
              />
            </div>

            {/* Yoga Type + Difficulty */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>
                  Yoga Type <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Hatha Yoga"
                  value={form.yogaType}
                  onChange={(e) => setField("yogaType", e.target.value)}
                  className="h-9 rounded-xl bg-input-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Difficulty <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(v) => setField("difficulty", v as ClassDifficulty)}
                >
                  <SelectTrigger className="h-9 rounded-xl bg-input-background/50">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Beginner</SelectItem>
                    <SelectItem value="MEDIUM">Intermediate</SelectItem>
                    <SelectItem value="HARD">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration + Link */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>
                  Duration (min) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="60"
                  value={form.duration}
                  onChange={(e) => setField("duration", e.target.value)}
                  className="h-9 rounded-xl bg-input-background/50"
                  min={1}
                />
              </div>
            </div>

            {/* Days of week */}
            <div className="space-y-1.5">
              <Label>
                Repeat on <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-1.5 flex-wrap">
                {ALL_DAYS.map((day) => {
                  const selected = form.daysOfWeek.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                        selected
                          ? "bg-[#610981] text-white border-[#610981]"
                          : "bg-white text-foreground border-border hover:border-[#610981]/50",
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time + Start Date + End Date */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>
                  Class Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="time"
                  value={form.timeOfDay}
                  onChange={(e) => setField("timeOfDay", e.target.value)}
                  className="h-9 rounded-xl bg-input-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                  className="h-9 rounded-xl bg-input-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  End Date
                  <span className="text-[10px] text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                  className="h-9 rounded-xl bg-input-background/50"
                />
              </div>
            </div>

            {/* Yoga Shikshak */}
            <div className="space-y-1.5">
              <Label>Yoga Shikshak</Label>
              <Select value={form.tutorId} onValueChange={(v) => setField("tutorId", v)}>
                <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                  <SelectValue placeholder="Assign a yoga shikshak (optional)" />
                </SelectTrigger>
                <SelectContent>
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
            </div>

            {/* Batch */}
            <div className="space-y-1.5">
              <Label>Batch</Label>
              <Select value={form.batchId} onValueChange={(v) => setField("batchId", v)}>
                <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                  <SelectValue placeholder="Assign to a batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={3}
                placeholder="Class description (optional)"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className="rounded-xl bg-input-background/50"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={saving}
              style={{ background: "#610981" }}
              className="gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingTemplate ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Generated Class Dialog ───────────────────────────────────────── */}
      {editingClass && (
        <EditGeneratedClassDialog
          cls={editingClass}
          tutors={tutors}
          batches={batches}
          role={role}
          onClose={() => setEditingClass(null)}
          onSaved={(updated) => {
            setGeneratedClasses((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c)),
            );
            setEditingClass(null);
          }}
        />
      )}

      {/* ── Delete Template Confirm ───────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTemplateTarget}
        onOpenChange={(o) => !o && setDeleteTemplateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete recurring template?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deleteTemplateTarget?.title}"</strong> template will be removed. Already
              generated classes will remain but won't be linked to this template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingTemplate}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              disabled={deletingTemplate}
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              {deletingTemplate && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Generated Class Confirm ────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteClassTarget}
        onOpenChange={(o) => !o && setDeleteClassTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this class?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deleteClassTarget?.title}"</strong> will be permanently removed. The
              recurring template will still generate future classes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingClass}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClass}
              disabled={deletingClass}
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              {deletingClass && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RecurringTemplateCard({
  template: t,
  onEdit,
  onToggle,
  onDelete,
}: {
  template: RecurringLiveClass;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const diffCfg = DIFFICULTY_CONFIG[t.difficulty];

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow overflow-hidden group",
        !t.isActive && "opacity-60",
      )}
    >
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium",
                diffCfg.color,
              )}
            >
              {diffCfg.label}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium",
                t.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-100 text-gray-500 border-gray-200",
              )}
            >
              <RefreshCw className="w-2.5 h-2.5" />
              {t.isActive ? "Active" : "Paused"}
            </span>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={onEdit}
              title="Edit"
              className="p-1.5 rounded-lg hover:bg-[#610981]/10 text-[#610981] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggle}
              title={t.isActive ? "Pause template" : "Activate template"}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border",
                t.isActive
                  ? "bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100",
              )}
            >
              {t.isActive ? (
                <><Pause className="w-3 h-3 fill-current" /> Pause</>
              ) : (
                <><Play className="w-3 h-3 fill-current" /> Activate</>
              )}
            </button>
            <button
              onClick={onDelete}
              title="Delete"
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="font-semibold text-sm text-foreground leading-snug">{t.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t.yogaType}</p>
        </div>

        {/* Tutor */}
        {t.tutor ? (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#610981]/5 border border-[#610981]/10">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarImage src={t.tutor.avatar ?? undefined} />
              <AvatarFallback
                className="text-[10px] font-bold text-white"
                style={{ background: "#610981" }}
              >
                {initials(t.tutor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#610981] truncate">{t.tutor.name}</p>
              {t.tutor.specializations.length > 0 && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {t.tutor.specializations.slice(0, 2).join(", ")}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border border-dashed border-border/60">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground italic">No tutor assigned</p>
          </div>
        )}

        {/* Schedule info */}
        <div className="flex flex-wrap gap-3 pt-1 border-t border-border/50">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
            {formatDays(t.daysOfWeek)}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {t.timeOfDay} · {t.duration} min
          </span>
          {t.batch && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Layers className="w-3.5 h-3.5" />
              {t.batch.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function GeneratedClassCard({
  cls,
  onEdit,
  onDelete,
}: {
  cls: LiveClass;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const diffCfg = DIFFICULTY_CONFIG[cls.difficulty];

  return (
    <div className="rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium",
                diffCfg.color,
              )}
            >
              {diffCfg.label}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium bg-blue-50 text-blue-700 border-blue-200">
              <RefreshCw className="w-2.5 h-2.5" />
              {cls.dayOfWeek ? DAY_FULL[cls.dayOfWeek] ?? cls.dayOfWeek : "Recurring"}
            </span>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-[#610981]/10 text-[#610981] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
            {cls.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{cls.yogaType}</p>
        </div>

        {/* Tutor */}
        {cls.tutor ? (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#610981]/5 border border-[#610981]/10">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarImage src={cls.tutor.avatar ?? undefined} />
              <AvatarFallback
                className="text-[10px] font-bold text-white"
                style={{ background: "#610981" }}
              >
                {initials(cls.tutor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#610981] truncate">{cls.tutor.name}</p>
              {cls.tutor.specializations.length > 0 && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {cls.tutor.specializations.slice(0, 2).join(", ")}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border border-dashed border-border/60">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground italic">No tutor assigned</p>
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 pt-1 border-t border-border/50">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {cls.duration} min
          </span>
          {cls.scheduledAt && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatSchedule(cls.scheduledAt)}
            </span>
          )}
          {cls.batch && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Layers className="w-3.5 h-3.5" />
              {cls.batch.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Generated Class Dialog ──────────────────────────────────────────────

function EditGeneratedClassDialog({
  cls,
  tutors,
  batches,
  role,
  onClose,
  onSaved,
}: {
  cls: LiveClass;
  tutors: Tutor[];
  batches: Batch[];
  role: "SUPERADMIN" | "OPERATIONS";
  onClose: () => void;
  onSaved: (updated: LiveClass) => void;
}) {
  const [form, setForm] = useState({
    title: cls.title,
    yogaType: cls.yogaType,
    difficulty: cls.difficulty as ClassDifficulty,
    duration: String(cls.duration),
    scheduledAt: toDatetimeLocalValue(cls.scheduledAt),
    tutorId: cls.tutor?.id ?? "",
    batchId: cls.batch?.id ?? "",
    description: cls.description ?? "",
  });
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const updated = await updateLiveClass(role, cls.id, {
        title: form.title.trim(),
        yogaType: form.yogaType.trim(),
        difficulty: form.difficulty,
        duration: Number(form.duration),
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        tutorId: form.tutorId || null,
        batchId: form.batchId || null,
        description: form.description || undefined,
      });
      onSaved(updated);
      toast.success("Class updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader className="min-w-0">
          <DialogTitle className="text-[#610981]">Edit Generated Class</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Title <span className="text-red-500">*</span></Label>
            <Input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              className="h-9 rounded-xl bg-input-background/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Yoga Type</Label>
              <Input
                value={form.yogaType}
                onChange={(e) => setField("yogaType", e.target.value)}
                className="h-9 rounded-xl bg-input-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v) => setField("difficulty", v as ClassDifficulty)}
              >
                <SelectTrigger className="h-9 rounded-xl bg-input-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Beginner</SelectItem>
                  <SelectItem value="MEDIUM">Intermediate</SelectItem>
                  <SelectItem value="HARD">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                value={form.duration}
                onChange={(e) => setField("duration", e.target.value)}
                className="h-9 rounded-xl bg-input-background/50"
                min={1}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Scheduled At</Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setField("scheduledAt", e.target.value)}
                className="h-9 rounded-xl bg-input-background/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Yoga Shikshak</Label>
            <Select value={form.tutorId} onValueChange={(v) => setField("tutorId", v)}>
              <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                <SelectValue placeholder="Assign a yoga shikshak" />
              </SelectTrigger>
              <SelectContent>
                {tutors.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Batch</Label>
            <Select value={form.batchId} onValueChange={(v) => setField("batchId", v)}>
              <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                <SelectValue placeholder="Assign to a batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} style={{ background: "#610981" }} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
