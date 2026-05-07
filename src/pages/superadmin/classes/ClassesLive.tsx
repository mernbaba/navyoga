import { useState, useEffect, useCallback } from "react";
import {
  Radio,
  Plus,
  Pencil,
  Trash2,
  User,
  Clock,
  CalendarDays,
  Layers,
  Loader2,
  Search,
  X,
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
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
} from "@/api/live";
import { listTutors } from "@/api/tutors";
import { listBatches } from "@/api/batches";
import type { LiveClass, ClassDifficulty, Tutor, Batch } from "@/api/types";
import { BatchesDialog } from "./BatchesDialog";

const DIFFICULTY_CONFIG: Record<ClassDifficulty, { label: string; color: string }> = {
  EASY: { label: "Beginner", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  MEDIUM: { label: "Intermediate", color: "bg-amber-50 text-amber-700 border-amber-200" },
  HARD: { label: "Advanced", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

const BLANK_FORM = {
  title: "",
  yogaType: "",
  difficulty: "" as ClassDifficulty | "",
  duration: "",
  description: "",
  tutorId: "",
  batchId: "",
  scheduledAt: "",
  link: "",
  recording: "",
};

type FormState = typeof BLANK_FORM;

function formatSchedule(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ClassesLive() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LiveClass | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LiveClass | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [batchesDialogOpen, setBatchesDialogOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    listLiveClasses("SUPERADMIN")
      .then(setClasses)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load classes"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    listTutors("SUPERADMIN", { limit: 100, status: "ACTIVE" })
      .then((r) => setTutors(r.items))
      .catch(() => {});
    listBatches("SUPERADMIN", { limit: 100 })
      .then((r) => setBatches(r.items))
      .catch(() => {});
  }, [load]);

  const filtered = classes.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openCreate() {
    setEditing(null);
    setForm(BLANK_FORM);
    setDialogOpen(true);
  }

  function openEdit(cls: LiveClass) {
    setEditing(cls);
    setForm({
      title: cls.title,
      yogaType: cls.yogaType,
      difficulty: cls.difficulty,
      duration: String(cls.duration),
      description: cls.description ?? "",
      tutorId: cls.tutor?.id ?? "",
      batchId: cls.batch?.id ?? "",
      scheduledAt: cls.scheduledAt
        ? new Date(cls.scheduledAt).toISOString().slice(0, 16)
        : "",
      link: cls.link ?? "",
      recording: cls.recording ?? "",
    });
    setDialogOpen(true);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.yogaType) return toast.error("Yoga type is required");
    if (!form.difficulty) return toast.error("Difficulty is required");
    if (!form.duration || isNaN(Number(form.duration))) return toast.error("Valid duration is required");

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        yogaType: form.yogaType,
        difficulty: form.difficulty as ClassDifficulty,
        duration: Number(form.duration),
        ...(form.description ? { description: form.description } : {}),
        tutorId: form.tutorId || null,
        batchId: form.batchId || null,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        link: form.link || null,
        recording: form.recording || null,
      };

      if (editing) {
        const updated = await updateLiveClass("SUPERADMIN", editing.id, payload);
        setClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast.success("Class updated");
      } else {
        const created = await createLiveClass("SUPERADMIN", {
          ...payload,
          tutorId: payload.tutorId ?? undefined,
          batchId: payload.batchId ?? undefined,
          scheduledAt: payload.scheduledAt ?? undefined,
          link: payload.link ?? undefined,
          recording: payload.recording ?? undefined,
        });
        setClasses((prev) => [created, ...prev]);
        toast.success("Live class created");
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLiveClass("SUPERADMIN", deleteTarget.id);
      setClasses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Class deleted");
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#610981" }}>
            Live Classes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Schedule and manage live yoga sessions with tutors
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setBatchesDialogOpen(true)}
            className="gap-2"
          >
            <Layers className="w-4 h-4" />
            Batches
          </Button>
          <Button
            onClick={openCreate}
            className="gap-2"
            style={{ background: "#610981" }}
          >
            <Plus className="w-4 h-4" />
            New Live Class
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10 pointer-events-none" />
          <Input
            className="pl-9 pr-8"
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#610981]/40" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border/60">
          <Radio className="w-12 h-12 mb-4 text-[#610981]/25" />
          <p className="text-sm font-medium text-muted-foreground">No live classes found</p>
          {search && (
            <p className="text-xs text-muted-foreground mt-1">
              Try clearing your search
            </p>
          )}
          {!search && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5"
              onClick={openCreate}
            >
              <Plus className="w-3.5 h-3.5" />
              Create your first live class
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((cls) => (
            <LiveClassCard
              key={cls.id}
              cls={cls}
              onEdit={() => openEdit(cls)}
              onDelete={() => setDeleteTarget(cls)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#610981]">
              {editing ? "Edit Live Class" : "New Live Class"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label>
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Morning Vinyasa Flow"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
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
                  <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Beginner</SelectItem>
                    <SelectItem value="MEDIUM">Intermediate</SelectItem>
                    <SelectItem value="HARD">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <Label>
                Duration (mins) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                placeholder="60"
                value={form.duration}
                onChange={(e) => setField("duration", e.target.value)}
              />
            </div>

            {/* Scheduled At */}
            <div className="space-y-1.5">
              <Label>Scheduled At</Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setField("scheduledAt", e.target.value)}
              />
            </div>

            {/* Join Link */}
            <div className="space-y-1.5">
              <Label>Join Link</Label>
              <Input
                placeholder="https://meet.google.com/…"
                value={form.link}
                onChange={(e) => setField("link", e.target.value)}
              />
            </div>

            {/* Recording */}
            <div className="space-y-1.5">
              <Label>Recording URL</Label>
              <Input
                placeholder="https://… (paste recording link after class)"
                value={form.recording}
                onChange={(e) => setField("recording", e.target.value)}
              />
            </div>

            {/* Tutor */}
            <div className="space-y-1.5">
              <Label>Tutor</Label>
              <Select
                value={form.tutorId || "__none__"}
                onValueChange={(v) => setField("tutorId", v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                  <SelectValue placeholder="Assign a tutor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No tutor assigned</SelectItem>
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
              {form.tutorId && (
                <TutorPreview tutor={tutors.find((t) => t.id === form.tutorId) ?? null} />
              )}
            </div>

            {/* Batch */}
            <div className="space-y-1.5">
              <Label>Batch</Label>
              <Select
                value={form.batchId || "__none__"}
                onValueChange={(v) => setField("batchId", v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                  <SelectValue placeholder="Assign to a batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No batch</SelectItem>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ background: "#610981" }}
              className="gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? "Save Changes" : "Create Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete live class?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deleteTarget?.title}"</strong> will be permanently removed. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BatchesDialog
        open={batchesDialogOpen}
        onOpenChange={(open) => {
          setBatchesDialogOpen(open);
          if (!open) {
            listBatches("SUPERADMIN", { limit: 100 })
              .then((r) => setBatches(r.items))
              .catch(() => {});
          }
        }}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LiveClassCard({
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

function TutorPreview({ tutor }: { tutor: Tutor | null }) {
  if (!tutor) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#610981]/5 border border-[#610981]/15 mt-1">
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={tutor.avatar ?? undefined} />
        <AvatarFallback
          className="text-xs font-bold text-white"
          style={{ background: "#610981" }}
        >
          {initials(tutor.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#610981]">{tutor.name}</p>
        <p className="text-[11px] text-muted-foreground">
          {tutor.specializations.slice(0, 3).join(", ") || "No specializations"}
        </p>
      </div>
    </div>
  );
}
