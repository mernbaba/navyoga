import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
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
  Upload,
  Video as VideoIcon,
  Copy,
  CheckCheck,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Check,
  Minus,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/components/ui/utils";
import { DownloadMediaButton } from "@/components/media/DownloadMediaButton";
import {
  listLiveClasses,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
  requestLiveClassRecordingPresign,
} from "@/api/live";
import { listTutors } from "@/api/tutors";
import { extractRelativePath } from "@/lib/media";
import { toDatetimeLocalValue, formatISTDateTimeYear } from "@/lib/datetime";
import { listBatches } from "@/api/batches";
import type { LiveClass, ClassDifficulty, Tutor, Batch } from "@/api/types";
import { BatchesDialog } from "./BatchesDialog";
import { useClassesRole, useClassesBasePath } from "./classesRole";

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
  recording: "",
};

type FormState = typeof BLANK_FORM;

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

const DAY_FULL: Record<string, string> = {
  MON: "Monday", TUE: "Tuesday", WED: "Wednesday",
  THU: "Thursday", FRI: "Friday", SAT: "Saturday", SUN: "Sunday",
};

export function ClassesLive() {
  const navigate = useNavigate();
  const role = useClassesRole();
  const classesBase = useClassesBasePath();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"card" | "table">("card");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LiveClass | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [recordingPasteMode, setRecordingPasteMode] = useState(false);
  const [recordingCopied, setRecordingCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LiveClass | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [batchesDialogOpen, setBatchesDialogOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    listLiveClasses(role)
      .then(setClasses)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load classes"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    listTutors(role, { limit: 100, status: "ACTIVE" })
      .then((r) => setTutors(r.items))
      .catch(() => {});
    listBatches(role, { limit: 100 })
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
    setRecordingFile(null);
    setRecordingPasteMode(false);
    setRecordingCopied(false);
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
      scheduledAt: toDatetimeLocalValue(cls.scheduledAt),
      recording: cls.recording ?? "",
    });
    setRecordingFile(null);
    setRecordingPasteMode(false);
    setRecordingCopied(false);
    setDialogOpen(true);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.yogaType.trim()) return toast.error("Yoga type is required");
    if (!form.difficulty) return toast.error("Difficulty is required");
    if (!form.duration || isNaN(Number(form.duration))) return toast.error("Valid duration is required");
    if (!form.scheduledAt) return toast.error("Scheduled date/time is required");
    if (!form.tutorId) return toast.error("Yoga Shikshak is required");
    if (!form.batchId) return toast.error("Batch is required");

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        yogaType: form.yogaType.trim(),
        difficulty: form.difficulty as ClassDifficulty,
        duration: Number(form.duration),
        ...(form.description ? { description: form.description } : {}),
        tutorId: form.tutorId,
        batchId: form.batchId,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        recording: recordingFile ? null : form.recording || null,
      };

      let saved: LiveClass;
      if (editing) {
        saved = await updateLiveClass(role, editing.id, payload);
      } else {
        saved = await createLiveClass(role, {
          ...payload,
          recording: payload.recording ?? undefined,
        });
      }

      if (recordingFile) {
        const presign = await requestLiveClassRecordingPresign(role, saved.id, {
          filename: recordingFile.name,
          contentType: recordingFile.type || "video/mp4",
        });
        const putRes = await fetch(presign.url, {
          method: "PUT",
          headers: { "Content-Type": recordingFile.type || "video/mp4" },
          body: recordingFile,
        });
        if (!putRes.ok) throw new Error("Recording upload failed");
        saved = await updateLiveClass(role, saved.id, { recording: presign.storePath });
      }

      setClasses((prev) => {
        const exists = prev.some((c) => c.id === saved.id);
        return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev];
      });
      toast.success(editing ? "Class updated" : "Live class created");
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
      await deleteLiveClass(role, deleteTarget.id);
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
            variant="outline"
            onClick={() => navigate(`${classesBase}/live-recurring`)}
            className="gap-2"
            style={{ borderColor: "#610981", color: "#610981" }}
          >
            <RefreshCw className="w-4 h-4" />
            Recurring Live Class
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

        {/* View toggle */}
        <div className="ml-auto inline-flex items-center rounded-xl border bg-white/60 p-0.5">
          <button
            type="button"
            onClick={() => setView("card")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              view === "card"
                ? "bg-[#610981] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Cards
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              view === "table"
                ? "bg-[#610981] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Table
          </button>
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
      ) : view === "card" ? (
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
      ) : (
        <LiveClassTable
          classes={filtered}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader className="min-w-0">
            <DialogTitle className="text-[#610981]">
              {editing ? "Edit Live Class" : "New Live Class"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 min-w-0">
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
              <Label>
                Scheduled At <span className="text-red-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setField("scheduledAt", e.target.value)}
              />
            </div>

            {/* Recording */}
            <div className="space-y-1.5">
              <Label>
                Recording{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  · optional · MP4, WEBM, MOV, or MKV
                </span>
              </Label>

              {recordingPasteMode ? (
                <div className="space-y-1.5">
                  <Input
                    placeholder="Paste a recording path, e.g. /live/abc-123/recording.mp4"
                    value={form.recording}
                    disabled={saving}
                    onChange={(e) => setField("recording", e.target.value)}
                  />
                  <button
                    type="button"
                    className="text-xs text-[#610981] hover:underline"
                    onClick={() => { setRecordingPasteMode(false); setField("recording", ""); setRecordingFile(null); }}
                  >
                    Upload a file instead
                  </button>
                </div>
              ) : (
                <>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/30 transition-colors overflow-hidden">
                    <input
                      id="live-recording-pick"
                      type="file"
                      accept=".mp4,.webm,.mov,.mkv,video/mp4,video/webm,video/quicktime,video/x-matroska"
                      className="hidden"
                      disabled={saving}
                      onChange={(e) => setRecordingFile(e.target.files?.[0] ?? null)}
                    />
                    <label
                      htmlFor="live-recording-pick"
                      className="cursor-pointer flex flex-col items-center gap-1.5 w-full min-w-0"
                    >
                      {recordingFile ? (
                        <>
                          <VideoIcon className="w-6 h-6 text-[#610981]" />
                          <p className="text-sm font-medium w-full px-2 truncate text-center">
                            {recordingFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Click to choose a different file
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {form.recording
                              ? "Click to replace recording"
                              : "Click to upload recording from your device"}
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-[#610981] hover:underline"
                    onClick={() => setRecordingPasteMode(true)}
                  >
                    Or paste a path instead
                  </button>
                </>
              )}

              {/* Saved path display with copy button */}
              {form.recording && !recordingFile && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40 border text-xs font-mono">
                  <span className="truncate flex-1 text-muted-foreground" title={extractRelativePath(form.recording)}>
                    {extractRelativePath(form.recording)}
                  </span>
                  <DownloadMediaButton
                    path={form.recording}
                    className="shrink-0"
                    title="Download recording"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(extractRelativePath(form.recording));
                      setRecordingCopied(true);
                      setTimeout(() => setRecordingCopied(false), 1500);
                    }}
                  >
                    {recordingCopied
                      ? <CheckCheck className="w-3.5 h-3.5 text-green-600" />
                      : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              )}

              {(recordingFile || form.recording) && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={saving}
                    onClick={() => {
                      setRecordingFile(null);
                      setField("recording", "");
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Remove
                  </Button>
                </div>
              )}
            </div>

            {/* Yoga Shikshak */}
            <div className="space-y-1.5">
              <Label>
                Yoga Shikshak <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.tutorId}
                onValueChange={(v) => setField("tutorId", v)}
              >
                <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                  <SelectValue placeholder="Assign a yoga shikshak" />
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
              {form.tutorId && (
                <TutorPreview tutor={tutors.find((t) => t.id === form.tutorId) ?? null} />
              )}
            </div>

            {/* Batch */}
            <div className="space-y-1.5">
              <Label>
                Batch <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.batchId}
                onValueChange={(v) => setField("batchId", v)}
              >
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
            listBatches(role, { limit: 100 })
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
            {cls.recurringId && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium bg-blue-50 text-blue-700 border-blue-200">
                <RefreshCw className="w-2.5 h-2.5" />
                {cls.dayOfWeek ? DAY_FULL[cls.dayOfWeek] ?? cls.dayOfWeek : "Recurring"}
              </span>
            )}
            {cls.recording && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium bg-[#610981]/10 text-[#610981] border-[#610981]/20">
                <VideoIcon className="w-3 h-3" />
                Recording added
              </span>
            )}
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

function LiveClassTable({
  classes,
  onEdit,
  onDelete,
}: {
  classes: LiveClass[];
  onEdit: (cls: LiveClass) => void;
  onDelete: (cls: LiveClass) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#610981]/5 hover:bg-[#610981]/5">
            <TableHead className="text-[#610981] font-semibold">Class</TableHead>
            <TableHead className="text-[#610981] font-semibold">Level</TableHead>
            <TableHead className="text-[#610981] font-semibold">Yoga Shikshak</TableHead>
            <TableHead className="text-[#610981] font-semibold">Duration</TableHead>
            <TableHead className="text-[#610981] font-semibold">Scheduled</TableHead>
            <TableHead className="text-[#610981] font-semibold">Batch</TableHead>
            <TableHead className="text-[#610981] font-semibold text-center">Recording added</TableHead>
            <TableHead className="text-[#610981] font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((cls) => {
            const diffCfg = DIFFICULTY_CONFIG[cls.difficulty];
            return (
              <TableRow key={cls.id} className="group">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground leading-snug flex items-center gap-1.5">
                      {cls.title}
                      {cls.recurringId && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600">
                          <RefreshCw className="w-2.5 h-2.5" />
                          {cls.dayOfWeek ? DAY_FULL[cls.dayOfWeek] ?? cls.dayOfWeek : "Recurring"}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{cls.yogaType}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium",
                      diffCfg.color,
                    )}
                  >
                    {diffCfg.label}
                  </span>
                </TableCell>
                <TableCell>
                  {cls.tutor ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6 shrink-0">
                        <AvatarImage src={cls.tutor.avatar ?? undefined} />
                        <AvatarFallback
                          className="text-[9px] font-bold text-white"
                          style={{ background: "#610981" }}
                        >
                          {initials(cls.tutor.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground truncate max-w-[140px]">
                        {cls.tutor.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {cls.duration} min
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatSchedule(cls.scheduledAt) ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {cls.batch?.name ?? "—"}
                </TableCell>
                <TableCell className="text-center">
                  {cls.recording ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                      <Check className="w-3 h-3" />
                      Added
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium bg-muted/40 text-muted-foreground border-border/60">
                      <Minus className="w-3 h-3" />
                      None
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(cls)}
                      className="p-1.5 rounded-lg hover:bg-[#610981]/10 text-[#610981] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(cls)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
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
