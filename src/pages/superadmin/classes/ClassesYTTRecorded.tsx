import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import { Switch } from "../../../components/ui/switch";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
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
import {
  Video,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  FolderOpen,
  Clock,
  ArrowUp,
  ArrowDown,
  Upload,
  FileVideo,
  Image as ImageIcon,
  Copy,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  listYTTRecordedCourses,
  createYTTRecordedCourse,
  updateYTTRecordedCourse,
  deleteYTTRecordedCourse,
  getYTTRecordedCourse,
  createYTTRecordedModule,
  updateYTTRecordedModule,
  deleteYTTRecordedModule,
  createYTTRecordedClass,
  updateYTTRecordedClass,
  deleteYTTRecordedClass,
  reorderYTTRecordedModules,
  reorderYTTRecordedClasses,
  requestYTTRecordedClassPresign,
  deleteYTTRecordedClassMedia,
} from "../../../api/plans";
import type {
  YTTCourse,
  YTTCourseBody,
  YTTCourseDetail,
  YTTModule,
  YTTClass,
  ClassLevel,
} from "../../../api/types";
import { resolveMediaUrl, extractRelativePath } from "../../../lib/media";
import { DownloadMediaButton } from "@/components/media/DownloadMediaButton";
import { useClassesRole } from "./classesRole";

const BRAND = "#610981";

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function extractVideoMeta(file: File): Promise<{ durationSec: number; thumbnail: Blob }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.crossOrigin = "anonymous";
    let settled = false;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    };
    const finish = (err: Error | null, payload?: { durationSec: number; thumbnail: Blob }) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      cleanup();
      if (err || !payload) reject(err ?? new Error("Couldn't read video"));
      else resolve(payload);
    };
    const timeout = window.setTimeout(() => finish(new Error("Couldn't read video metadata")), 8000);

    video.onloadedmetadata = () => {
      const seconds = video.duration;
      if (!Number.isFinite(seconds) || seconds <= 0) {
        finish(new Error("Video has no readable duration"));
        return;
      }
      const seekTo = Math.min(Math.max(seconds * 0.1, 1), seconds - 0.1);
      video.currentTime = seekTo;
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        const maxW = 1280;
        const scale = w > maxW ? maxW / w : 1;
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) { finish(new Error("Canvas not available")); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) { finish(new Error("Couldn't capture thumbnail")); return; }
            finish(null, { durationSec: video.duration, thumbnail: blob });
          },
          "image/jpeg",
          0.85,
        );
      } catch (err) {
        finish(err instanceof Error ? err : new Error("Thumbnail capture failed"));
      }
    };
    video.onerror = () => finish(new Error("Couldn't read video"));
    video.src = url;
  });
}

const LEVELS: Exclude<ClassLevel, "ALL_LEVELS">[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const levelLabel = (l: ClassLevel) =>
  l === "ALL_LEVELS" ? "All Levels" : l.charAt(0) + l.slice(1).toLowerCase();

// ─── COURSE FORM DIALOG (Add + Edit) ──────────────────────────────────────────

interface CourseFormDialogProps {
  open: boolean;
  initial?: YTTCourse | null;
  onClose: () => void;
  onSaved: (course: YTTCourse, mode: "create" | "edit") => void;
}

type CourseFormState = Omit<YTTCourseBody, "level"> & { level: Exclude<ClassLevel, "ALL_LEVELS"> | "" };

const EMPTY_COURSE: CourseFormState = {
  title: "",
  yogaType: "",
  description: "",
  thumbnail: "",
  level: "",
  isActive: true,
};

function CourseFormDialog({ open, initial, onClose, onSaved }: CourseFormDialogProps) {
  const isEdit = !!initial;
  const role = useClassesRole();
  const [form, setForm] = useState<CourseFormState>(EMPTY_COURSE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title,
        yogaType: initial.yogaType,
        description: initial.description ?? "",
        thumbnail: initial.thumbnail ?? "",
        level: initial.level === "ALL_LEVELS" ? "" : initial.level,
        isActive: initial.isActive,
      });
    } else {
      setForm(EMPTY_COURSE);
    }
    setSaving(false);
  }, [initial, open]);

  const valid =
    form.title.trim().length > 0 &&
    form.yogaType.trim().length > 0 &&
    !!form.level &&
    (form.description?.trim().length ?? 0) > 0;

  async function handleSave() {
    if (!valid) return;
    setSaving(true);
    try {
      const body: YTTCourseBody = {
        title: form.title.trim(),
        yogaType: form.yogaType.trim(),
        level: form.level as ClassLevel,
        isActive: form.isActive,
        description: form.description!.trim(),
        ...(form.thumbnail?.trim() ? { thumbnail: form.thumbnail.trim() } : {}),
      };
      const saved = isEdit && initial
        ? await updateYTTRecordedCourse(initial.id, body, role)
        : await createYTTRecordedCourse(body, role);
      toast.success(isEdit ? "Course updated" : "Course created");
      onSaved(saved, isEdit ? "edit" : "create");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save course");
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !saving) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Course" : "Add Course"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update course details." : "Create a new YTT recorded course."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="course-title">Title *</Label>
            <Input
              id="course-title"
              placeholder="e.g. 200 hr Hatha Yoga TTC"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="course-yoga">Yoga Type *</Label>
              <Input
                id="course-yoga"
                placeholder="e.g. Hatha, Vinyasa"
                value={form.yogaType}
                onChange={(e) => setForm((f) => ({ ...f, yogaType: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Level *</Label>
              <Select
                value={form.level || undefined}
                onValueChange={(v: Exclude<ClassLevel, "ALL_LEVELS">) => setForm((f) => ({ ...f, level: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => <SelectItem key={l} value={l}>{levelLabel(l)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="course-desc">Description *</Label>
            <Textarea
              id="course-desc"
              rows={3}
              className="min-h-20 max-h-40"
              placeholder="What sādhakas will learn"
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          {!isEdit && (
            <>
              <div className="space-y-1">
                <Label htmlFor="course-thumb">Thumbnail URL</Label>
                <Input
                  id="course-thumb"
                  placeholder="optional · image URL"
                  value={form.thumbnail ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Switch
                  id="course-active"
                  checked={form.isActive ?? true}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                />
                <Label htmlFor="course-active">Active</Label>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button disabled={!valid || saving} onClick={handleSave} style={{ background: BRAND }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── EDIT MODULE DIALOG ───────────────────────────────────────────────────────

interface EditModuleDialogProps {
  open: boolean;
  courseId: string;
  mod: YTTModule;
  onClose: () => void;
  onUpdated: (updated: YTTModule) => void;
}

function EditModuleDialog({ open, courseId, mod, onClose, onUpdated }: EditModuleDialogProps) {
  const role = useClassesRole();
  const [title, setTitle] = useState(mod.title);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(mod.title);
    setSaving(false);
  }, [mod.id, mod.title]);

  async function handleSave() {
    if (!title.trim() || title.trim() === mod.title) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const updated = await updateYTTRecordedModule(courseId, mod.id, { title: title.trim() }, role);
      toast.success("Module renamed");
      onUpdated(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update module");
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !saving) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Module</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="edit-mod-title">Module Title</Label>
          <Input
            id="edit-mod-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button disabled={!title.trim() || saving} onClick={handleSave} style={{ background: BRAND }}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ADD MODULE DIALOG ────────────────────────────────────────────────────────

interface AddModuleDialogProps {
  open: boolean;
  courseId: string;
  onClose: () => void;
  onCreated: (mod: YTTModule) => void;
}

function AddModuleDialog({ open, courseId, onClose, onCreated }: AddModuleDialogProps) {
  const role = useClassesRole();
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
      const mod = await createYTTRecordedModule(courseId, { title: title.trim() }, role);
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

function AddClassDialog({ open, courseId, moduleId, moduleName, onClose, onCreated }: AddClassDialogProps) {
  const role = useClassesRole();
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pasteVideoMode, setPasteVideoMode] = useState(false);
  const [pastedVideoPath, setPastedVideoPath] = useState("");
  const [detectedDurationMin, setDetectedDurationMin] = useState<number | null>(null);
  const [autoThumb, setAutoThumb] = useState<Blob | null>(null);
  const [autoThumbUrl, setAutoThumbUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailFileUrl, setThumbnailFileUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!autoThumb) { setAutoThumbUrl(null); return; }
    const url = URL.createObjectURL(autoThumb);
    setAutoThumbUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [autoThumb]);

  useEffect(() => {
    if (!thumbnailFile) { setThumbnailFileUrl(null); return; }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  function reset() {
    setStep(1);
    setTitle("");
    setDescription("");
    setDuration("");
    setVideoFile(null);
    setPasteVideoMode(false);
    setPastedVideoPath("");
    setDetectedDurationMin(null);
    setAutoThumb(null);
    setThumbnailFile(null);
    setExtracting(false);
    setSaving(false);
  }

  function handleThumbnailChosen(file: File | null) {
    if (!file) { setThumbnailFile(null); return; }
    const okType = /^image\/(jpeg|png)$/i.test(file.type);
    const okExt = /\.(jpe?g|png)$/i.test(file.name);
    if (!okType && !okExt) {
      toast.error("Thumbnail must be a .jpg or .png image");
      return;
    }
    setThumbnailFile(file);
  }

  async function handleVideoChosen(file: File | null) {
    setVideoFile(file);
    setDetectedDurationMin(null);
    setAutoThumb(null);
    if (!file) return;
    setExtracting(true);
    try {
      const { durationSec, thumbnail } = await extractVideoMeta(file);
      const minutes = Math.max(1, Math.round(durationSec / 60));
      setDetectedDurationMin(minutes);
      setDuration(String(minutes));
      setAutoThumb(thumbnail);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't read the video");
    } finally {
      setExtracting(false);
    }
  }

  const detailsValid = title.trim().length > 0 && Number(duration) > 0;
  const previewImageUrl = thumbnailFileUrl || autoThumbUrl;
  const displayDuration = detectedDurationMin ?? (duration ? Number(duration) : null);

  async function handlePublish() {
    if (!detailsValid || (!videoFile && !pastedVideoPath.trim())) return;
    setSaving(true);
    let createdId: string | null = null;
    try {
      // 1. Create class shell (without video) so we have an id to scope S3 keys.
      const created = await createYTTRecordedClass(courseId, moduleId, {
        title: title.trim(),
        duration: Number(duration),
        ...(description.trim() ? { description: description.trim() } : {}),
      }, role);
      createdId = created.id;

      if (videoFile) {
        // 2a. Presign + PUT video, then patch the storePath.
        const videoPresign = await requestYTTRecordedClassPresign(courseId, moduleId, created.id, {
          kind: "video",
          filename: videoFile.name,
          contentType: videoFile.type,
        }, role);
        await fetch(videoPresign.url, {
          method: "PUT",
          headers: { "Content-Type": videoFile.type },
          body: videoFile,
        });
        await updateYTTRecordedClass(courseId, moduleId, created.id, { video: videoPresign.storePath }, role);

        // 3. Upload thumbnail - prefer user-picked file, fall back to auto-captured frame.
        const thumbBlob: Blob | null = thumbnailFile ?? autoThumb;
        if (thumbBlob) {
          const thumbName = thumbnailFile?.name ?? "thumbnail.jpg";
          const thumbType = thumbnailFile?.type || "image/jpeg";
          try {
            const thumbPresign = await requestYTTRecordedClassPresign(courseId, moduleId, created.id, {
              kind: "thumbnail",
              filename: thumbName,
              contentType: thumbType,
            }, role);
            await fetch(thumbPresign.url, {
              method: "PUT",
              headers: { "Content-Type": thumbType },
              body: thumbBlob,
            });
            await updateYTTRecordedClass(courseId, moduleId, created.id, { thumbnail: thumbPresign.storePath }, role);
          } catch (thumbErr) {
            toast.error(
              thumbErr instanceof Error
                ? `Class created, but thumbnail upload failed: ${thumbErr.message}.`
                : "Thumbnail upload failed.",
            );
          }
        }
      } else {
        // 2b. Reuse an existing path directly - no upload needed.
        await updateYTTRecordedClass(courseId, moduleId, created.id, { video: pastedVideoPath.trim() }, role);
      }

      toast.success("Class added");
      onCreated();
      reset();
    } catch (err) {
      // Roll back the placeholder class so we don't leave orphaned rows.
      if (createdId) {
        try { await deleteYTTRecordedClass(courseId, moduleId, createdId, role); } catch { /* swallow */ }
      }
      toast.error(err instanceof Error ? err.message : "Failed to add class");
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !saving) { reset(); onClose(); } }}>
      <DialogContent
        className={`${step === 2 ? "max-w-lg" : "max-w-md"} max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden`}
      >
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
          <DialogTitle style={step === 2 ? { color: BRAND } : undefined}>
            {step === 2 ? "Upload Class Video" : "Add Class"}
          </DialogTitle>
          <DialogDescription>
            {step === 2
              ? "Upload the video file for this class"
              : <>Adding to module: <span className="font-medium">{moduleName}</span></>}
            <span className="ml-2 text-xs text-muted-foreground">· Step {step} of 2</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {step === 1 ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="cls-title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="cls-title"
                  placeholder="e.g. Introduction to Pranayama"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cls-dur">Duration (min) <span className="text-red-500">*</span></Label>
                <Input
                  id="cls-dur"
                  type="number"
                  min={1}
                  step={1}
                  value={duration}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d+$/.test(v)) setDuration(v);
                  }}
                  onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "+") e.preventDefault(); }}
                />
                {duration !== "" && Number(duration) <= 0 && (
                  <p className="text-xs text-red-500">Duration must be a positive number</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="cls-desc">Description</Label>
                <Textarea
                  id="cls-desc"
                  rows={3}
                  className="min-h-20 max-h-40"
                  placeholder="optional · what sādhakas will learn"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Class preview header - 16:9 banner */}
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                {previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover opacity-90"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : null}
                {!previewImageUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-10 h-10 text-white/30" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black/80 backdrop-blur-sm rounded-md px-3 py-2">
                    <p className="text-white text-sm font-medium truncate">
                      {title.trim() || "Untitled class"}
                    </p>
                    <p className="text-white/70 text-xs mt-0.5 truncate">
                      {moduleName} · {displayDuration ? `${displayDuration} min` : "-"} · MP4
                    </p>
                  </div>
                </div>
              </div>

              {/* Thumbnail upload - optional, .jpg/.png only */}
              <div className="space-y-2">
                <Label htmlFor="cls-thumb-pick">
                  Thumbnail <span className="text-xs text-muted-foreground font-normal">· optional · .jpg or .png</span>
                </Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/30 transition-colors">
                  <input
                    id="cls-thumb-pick"
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className="hidden"
                    disabled={saving}
                    onChange={(e) => handleThumbnailChosen(e.target.files?.[0] ?? null)}
                  />
                  <label htmlFor="cls-thumb-pick" className="cursor-pointer flex flex-col items-center gap-1.5">
                    {thumbnailFile ? (
                      <>
                        <ImageIcon className="w-6 h-6" style={{ color: BRAND }} />
                        <p className="text-sm font-medium truncate max-w-full px-2">{thumbnailFile.name}</p>
                        <p className="text-xs text-muted-foreground">Click to choose a different image</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload thumbnail (auto-captured from video if skipped)
                        </p>
                      </>
                    )}
                  </label>
                </div>
                {thumbnailFile && (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={saving}
                      onClick={() => setThumbnailFile(null)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Remove
                    </Button>
                  </div>
                )}
              </div>

              {/* Video upload */}
              <div className="space-y-2">
                <Label htmlFor="cls-video-pick">
                  Video File <span className="text-red-500">*</span>
                </Label>
                {pasteVideoMode ? (
                  <div className="space-y-1.5">
                    <Input
                      placeholder="Paste a video path, e.g. /ytt-recorded/abc-123/video.mp4"
                      value={pastedVideoPath}
                      disabled={saving}
                      onChange={(e) => setPastedVideoPath(e.target.value)}
                    />
                    <button
                      type="button"
                      className="text-xs hover:underline"
                      style={{ color: BRAND }}
                      onClick={() => { setPasteVideoMode(false); setPastedVideoPath(""); }}
                    >
                      Upload a file instead
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/30 transition-colors">
                      <input
                        id="cls-video-pick"
                        type="file"
                        accept=".mp4,video/mp4"
                        className="hidden"
                        disabled={saving}
                        onChange={(e) => handleVideoChosen(e.target.files?.[0] ?? null)}
                      />
                      <label htmlFor="cls-video-pick" className="cursor-pointer flex flex-col items-center gap-1.5">
                        {videoFile ? (
                          <>
                            <FileVideo className="w-6 h-6" style={{ color: BRAND }} />
                            <p className="text-sm font-medium truncate max-w-full px-2">{videoFile.name}</p>
                            <p className="text-xs text-muted-foreground">Click to choose a different file</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to upload video (MP4)</p>
                          </>
                        )}
                      </label>
                    </div>
                    <button
                      type="button"
                      className="text-xs hover:underline"
                      style={{ color: BRAND }}
                      onClick={() => { setPasteVideoMode(true); setVideoFile(null); }}
                    >
                      Or paste a path instead
                    </button>
                  </>
                )}
              </div>

              {/* Metadata grid - only after video is picked */}
              {videoFile && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">File Size</p>
                    <p className="font-medium text-sm mt-0.5">{formatBytes(videoFile.size)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium text-sm mt-0.5">
                      {displayDuration ? `${displayDuration} min` : extracting ? "reading…" : "-"}
                    </p>
                  </div>
                </div>
              )}
              {videoFile && extracting && (
                <p className="text-xs text-muted-foreground text-center">
                  Capturing thumbnail from video…
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-background shrink-0">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
              <Button
                disabled={!detailsValid}
                onClick={() => setStep(2)}
                style={{ background: BRAND, color: "white" }}
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={saving}
              >
                Back
              </Button>
              <Button
                onClick={handlePublish}
                disabled={(!videoFile && !pastedVideoPath.trim()) || saving}
                style={{ background: BRAND, color: "white" }}
              >
                {saving ? "Publishing…" : "Publish"}
              </Button>
            </>
          )}
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
  const role = useClassesRole();
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState(cls.title);
  const [duration, setDuration] = useState(String(cls.duration));
  const [description, setDescription] = useState(cls.description ?? "");
  const [saving, setSaving] = useState(false);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pastePathMode, setPastePathMode] = useState(false);
  const [pastedPath, setPastedPath] = useState("");
  const [applyingPath, setApplyingPath] = useState(false);
  const [videoCopied, setVideoCopied] = useState(false);
  const [detectedDurationMin, setDetectedDurationMin] = useState<number | null>(null);
  const [autoThumb, setAutoThumb] = useState<Blob | null>(null);
  const [autoThumbUrl, setAutoThumbUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Reset everything when the target class changes.
  useEffect(() => {
    setStep(1);
    setTitle(cls.title);
    setDuration(String(cls.duration));
    setDescription(cls.description ?? "");
    setVideoFile(null);
    setPastePathMode(false);
    setPastedPath("");
    setVideoCopied(false);
    setDetectedDurationMin(null);
    setAutoThumb(null);
    setExtracting(false);
    setSaving(false);
    setUploading(false);
  }, [cls.id]);

  useEffect(() => {
    if (!autoThumb) { setAutoThumbUrl(null); return; }
    const url = URL.createObjectURL(autoThumb);
    setAutoThumbUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [autoThumb]);

  async function handleVideoChosen(file: File | null) {
    setVideoFile(file);
    setDetectedDurationMin(null);
    setAutoThumb(null);
    if (!file) return;
    setExtracting(true);
    try {
      const { durationSec, thumbnail } = await extractVideoMeta(file);
      const minutes = Math.max(1, Math.round(durationSec / 60));
      setDetectedDurationMin(minutes);
      setDuration(String(minutes));
      setAutoThumb(thumbnail);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't read the video");
    } finally {
      setExtracting(false);
    }
  }

  async function handleUploadVideo() {
    if (!videoFile) return;
    setUploading(true);
    try {
      // Replace the existing video if there was one.
      if (cls.video) {
        try { await deleteYTTRecordedClassMedia(courseId, moduleId, cls.id, "video", role); } catch { /* swallow */ }
      }
      const videoPresign = await requestYTTRecordedClassPresign(courseId, moduleId, cls.id, {
        kind: "video",
        filename: videoFile.name,
        contentType: videoFile.type,
      }, role);
      await fetch(videoPresign.url, {
        method: "PUT",
        headers: { "Content-Type": videoFile.type },
        body: videoFile,
      });
      let updated = await updateYTTRecordedClass(courseId, moduleId, cls.id, { video: videoPresign.storePath }, role);

      // Auto-upload captured thumbnail (best-effort, replaces any existing thumbnail).
      if (autoThumb) {
        try {
          if (cls.thumbnail) {
            try { await deleteYTTRecordedClassMedia(courseId, moduleId, cls.id, "thumbnail", role); } catch { /* swallow */ }
          }
          const thumbPresign = await requestYTTRecordedClassPresign(courseId, moduleId, cls.id, {
            kind: "thumbnail",
            filename: "thumbnail.jpg",
            contentType: "image/jpeg",
          }, role);
          await fetch(thumbPresign.url, {
            method: "PUT",
            headers: { "Content-Type": "image/jpeg" },
            body: autoThumb,
          });
          updated = await updateYTTRecordedClass(courseId, moduleId, cls.id, { thumbnail: thumbPresign.storePath }, role);
        } catch { /* non-fatal */ }
      }

      // Persist auto-detected duration if it differs from current.
      if (detectedDurationMin && detectedDurationMin !== updated.duration) {
        updated = await updateYTTRecordedClass(courseId, moduleId, cls.id, { duration: detectedDurationMin }, role);
        setDuration(String(detectedDurationMin));
      }

      toast.success("Video uploaded");
      onUpdated(updated);
      setVideoFile(null);
      setDetectedDurationMin(null);
      setAutoThumb(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload video");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteMedia() {
    if (!confirm("Remove the video from this class?")) return;
    try {
      await deleteYTTRecordedClassMedia(courseId, moduleId, cls.id, "video", role);
      // BE returns null; reflect the cleared video locally.
      onUpdated({ ...cls, video: "" });
      toast.success("Video removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete video");
    }
  }

  async function handleApplyPath() {
    const path = pastedPath.trim();
    if (!path) return;
    setApplyingPath(true);
    try {
      const updated = await updateYTTRecordedClass(courseId, moduleId, cls.id, { video: path }, role);
      toast.success("Video path applied");
      onUpdated(updated);
      setPastePathMode(false);
      setPastedPath("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply path");
    } finally {
      setApplyingPath(false);
    }
  }

  async function handleSave() {
    if (!isMetadataValid) return;
    setSaving(true);
    try {
      const trimmedDesc = description.trim();
      const updated = await updateYTTRecordedClass(courseId, moduleId, cls.id, {
        title: title.trim(),
        duration: Number(duration),
        description: trimmedDesc.length > 0 ? trimmedDesc : undefined,
      }, role);
      toast.success("Class updated");
      onUpdated(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update class");
      setSaving(false);
    }
  }

  const isMetadataValid = title.trim().length > 0 && Number(duration) > 0;
  const previewImageUrl =
    autoThumbUrl ?? (cls.thumbnail ? resolveMediaUrl(cls.thumbnail) ?? null : null);
  const displayDuration = detectedDurationMin ?? (duration ? Number(duration) : null);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !saving && !uploading) onClose(); }}>
      <DialogContent
        className={`${step === 2 ? "max-w-lg" : "max-w-md"} max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden`}
      >
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
          <DialogTitle style={step === 2 ? { color: BRAND } : undefined}>
            {step === 2 ? "Class Video" : "Edit Class"}
          </DialogTitle>
          <DialogDescription>
            {step === 2
              ? "Replace or remove the uploaded video"
              : <>Editing in module: <span className="font-medium">{moduleName}</span></>}
            <span className="ml-2 text-xs text-muted-foreground">· Step {step} of 2</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {step === 1 ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="ec-title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="ec-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ec-dur">Duration (min) <span className="text-red-500">*</span></Label>
                <Input
                  id="ec-dur"
                  type="number"
                  min={1}
                  step={1}
                  value={duration}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d+$/.test(v)) setDuration(v);
                  }}
                  onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "+") e.preventDefault(); }}
                />
                {duration !== "" && Number(duration) <= 0 && (
                  <p className="text-xs text-red-500">Duration must be a positive number</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="ec-desc">Description</Label>
                <Textarea
                  id="ec-desc"
                  rows={3}
                  className="min-h-20 max-h-40"
                  placeholder="optional · what sādhakas will learn"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Class preview header - 16:9 banner */}
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                {previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover opacity-90"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : null}
                {!previewImageUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-10 h-10 text-white/30" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black/80 backdrop-blur-sm rounded-md px-3 py-2">
                    <p className="text-white text-sm font-medium truncate">
                      {title.trim() || "Untitled class"}
                    </p>
                    <p className="text-white/70 text-xs mt-0.5 truncate">
                      {moduleName} · {displayDuration ? `${displayDuration} min` : "-"} · MP4
                    </p>
                  </div>
                </div>
              </div>

              {/* Existing video status (only when no new pick) */}
              {cls.video && !videoFile && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30">
                    <FileVideo className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-xs font-mono truncate flex-1 text-muted-foreground" title={extractRelativePath(cls.video)}>
                      {extractRelativePath(cls.video)}
                    </span>
                    <DownloadMediaButton
                      path={cls.video}
                      className="shrink-0"
                      title="Download video"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(extractRelativePath(cls.video));
                        setVideoCopied(true);
                        setTimeout(() => setVideoCopied(false), 1500);
                      }}
                    >
                      {videoCopied
                        ? <CheckCheck className="w-3.5 h-3.5 text-green-600" />
                        : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      disabled={uploading}
                      onClick={handleDeleteMedia}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Remove
                    </Button>
                  </div>

                  {/* Paste an existing path to replace without re-uploading */}
                  {pastePathMode ? (
                    <div className="flex gap-2 items-center">
                      <Input
                        className="h-8 text-xs font-mono"
                        placeholder="Paste a video path"
                        value={pastedPath}
                        disabled={applyingPath}
                        onChange={(e) => setPastedPath(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs shrink-0"
                        style={{ background: BRAND, color: "white" }}
                        disabled={!pastedPath.trim() || applyingPath}
                        onClick={handleApplyPath}
                      >
                        {applyingPath ? "Applying…" : "Apply"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs shrink-0"
                        onClick={() => { setPastePathMode(false); setPastedPath(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="text-xs hover:underline"
                      style={{ color: BRAND }}
                      onClick={() => setPastePathMode(true)}
                    >
                      Use an existing path instead
                    </button>
                  )}
                </div>
              )}

              {/* Paste-path for classes with no video yet */}
              {!cls.video && !videoFile && (
                pastePathMode ? (
                  <div className="space-y-1.5">
                    <div className="flex gap-2 items-center">
                      <Input
                        className="h-8 text-xs font-mono"
                        placeholder="Paste a video path"
                        value={pastedPath}
                        disabled={applyingPath}
                        onChange={(e) => setPastedPath(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs shrink-0"
                        style={{ background: BRAND, color: "white" }}
                        disabled={!pastedPath.trim() || applyingPath}
                        onClick={handleApplyPath}
                      >
                        {applyingPath ? "Applying…" : "Apply"}
                      </Button>
                    </div>
                    <button
                      type="button"
                      className="text-xs hover:underline"
                      style={{ color: BRAND }}
                      onClick={() => { setPastePathMode(false); setPastedPath(""); }}
                    >
                      Upload a file instead
                    </button>
                  </div>
                ) : null
              )}

              {/* Video upload (replace or new) */}
              <div className="space-y-2">
                <Label htmlFor="ec-video-pick">
                  {cls.video ? "Replace Video" : "Video File"}
                </Label>
                {!pastePathMode && (
                  <>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/30 transition-colors">
                      <input
                        id="ec-video-pick"
                        type="file"
                        accept=".mp4,video/mp4"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => handleVideoChosen(e.target.files?.[0] ?? null)}
                      />
                      <label htmlFor="ec-video-pick" className="cursor-pointer flex flex-col items-center gap-1.5">
                        {videoFile ? (
                          <>
                            <FileVideo className="w-6 h-6" style={{ color: BRAND }} />
                            <p className="text-sm font-medium truncate max-w-full px-2">{videoFile.name}</p>
                            <p className="text-xs text-muted-foreground">Click to choose a different file</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {cls.video ? "Click to replace video (MP4)" : "Click to upload video (MP4)"}
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                    {!cls.video && (
                      <button
                        type="button"
                        className="text-xs hover:underline"
                        style={{ color: BRAND }}
                        onClick={() => setPastePathMode(true)}
                      >
                        Or paste a path instead
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Metadata grid - only after a new video is picked */}
              {videoFile && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">File Size</p>
                    <p className="font-medium text-sm mt-0.5">{formatBytes(videoFile.size)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium text-sm mt-0.5">
                      {displayDuration ? `${displayDuration} min` : extracting ? "reading…" : "-"}
                    </p>
                  </div>
                </div>
              )}
              {videoFile && extracting && (
                <p className="text-xs text-muted-foreground text-center">
                  Capturing thumbnail from video…
                </p>
              )}

              {/* Upload action - only after a new video is picked */}
              {videoFile && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    style={{ background: BRAND, color: "white" }}
                    disabled={uploading || extracting}
                    onClick={handleUploadVideo}
                  >
                    {uploading ? "Uploading…" : cls.video ? "Replace Video" : "Upload Video"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-background shrink-0">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button
                disabled={!isMetadataValid || saving}
                onClick={handleSave}
                style={{ background: BRAND, color: "white" }}
              >
                {saving ? "Saving…" : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                disabled={saving}
              >
                Manage Video →
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={uploading}
              >
                ← Back
              </Button>
              <Button variant="outline" onClick={onClose} disabled={uploading}>Close</Button>
            </>
          )}
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
  const role = useClassesRole();
  const [detail, setDetail] = useState<YTTCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<YTTModule | null>(null);
  const [addClassFor, setAddClassFor] = useState<YTTModule | null>(null);
  const [editingClass, setEditingClass] = useState<{ mod: YTTModule; cls: YTTClass } | null>(null);
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  async function loadDetail() {
    try {
      const d = await getYTTRecordedCourse(course.id, role);
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
      await deleteYTTRecordedModule(course.id, mod.id, role);
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
      await deleteYTTRecordedClass(course.id, mod.id, classId, role);
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
        role,
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
        role,
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
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground px-2">
          <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold truncate" style={{ color: BRAND }}>{course.title}</h2>
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
              <div className="flex items-center w-full">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&>svg]:hidden">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{modIdx + 1}.</span>
                    <FolderOpen className="w-4 h-4 shrink-0" style={{ color: BRAND }} />
                    <span className="font-medium text-sm truncate">{mod.title}</span>
                    <Badge variant="secondary" className="ml-1 shrink-0">{mod.classes.length} class{mod.classes.length !== 1 ? "es" : ""}</Badge>
                  </div>
                </AccordionTrigger>
                <div className="flex items-center gap-0.5 shrink-0">
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
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); setEditingModule(mod); }}
                    title="Rename module"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    disabled={deletingModuleId === mod.id}
                    onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod); }}
                    title="Delete module"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex-1" />
                {mod.classes.length > 0 && (
                  <div className="pr-3 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs font-medium gap-1 rounded-md border-[#610981]/30 text-[#610981] hover:bg-[#610981]/5 hover:text-[#610981] hover:border-[#610981]/50"
                      onClick={(e) => { e.stopPropagation(); setAddClassFor(mod); }}
                      title="Add class"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Class
                    </Button>
                  </div>
                )}
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
                  {mod.classes.length === 0 && (
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
                    </div>
                  )}
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

      {editingModule && (
        <EditModuleDialog
          open={!!editingModule}
          courseId={course.id}
          mod={editingModule}
          onClose={() => setEditingModule(null)}
          onUpdated={(updated) => {
            setDetail((d) => d ? {
              ...d,
              modules: d.modules.map((m) => (m.id === updated.id ? { ...m, title: updated.title } : m)),
            } : d);
            setEditingModule(null);
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
  onEdit: () => void;
  onDelete: () => void;
}

function CourseCard({ course, onSelect, onEdit, onDelete }: CourseCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: `${BRAND}15` }}>
            <Video className="w-5 h-5" style={{ color: BRAND }} />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge variant={course.isActive ? "default" : "secondary"}>
              {course.isActive ? "Active" : "Inactive"}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              title="Edit course"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {/* <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Delete course"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button> */}
          </div>
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
  const role = useClassesRole();
  const [courses, setCourses] = useState<YTTCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<YTTCourse | null>(null);
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<YTTCourse | null>(null);
  const [deleteCourseTarget, setDeleteCourseTarget] = useState<YTTCourse | null>(null);
  const [deletingCourse, setDeletingCourse] = useState(false);

  useEffect(() => {
    listYTTRecordedCourses(role)
      .then(setCourses)
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to load courses"))
      .finally(() => setLoading(false));
  }, []);

  function openCreateCourse() {
    setEditingCourse(null);
    setCourseFormOpen(true);
  }

  function openEditCourse(course: YTTCourse) {
    setEditingCourse(course);
    setCourseFormOpen(true);
  }

  async function handleConfirmDeleteCourse() {
    if (!deleteCourseTarget) return;
    setDeletingCourse(true);
    try {
      await deleteYTTRecordedCourse(deleteCourseTarget.id, role);
      toast.success("Course deleted");
      setCourses((prev) => prev.filter((c) => c.id !== deleteCourseTarget.id));
      setDeleteCourseTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete course");
    } finally {
      setDeletingCourse(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: BRAND }}>YTT Recorded</h1>
          <p className="text-muted-foreground text-sm mt-1">Yoga Teacher Training - recorded sessions</p>
        </div>
        {/* <Button onClick={openCreateCourse} style={{ background: BRAND }}>
          <Plus className="w-4 h-4 mr-1" /> Add Course
        </Button> */}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading courses…</div>
      )}

      {!loading && !selected && (
        <>
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border/60 gap-3">
              <Video className="w-12 h-12 text-[#610981]/30" />
              <p className="text-sm text-muted-foreground">No courses yet. Click "Add Course" to create one.</p>
              <Button size="sm" onClick={openCreateCourse} style={{ background: BRAND }}>
                <Plus className="w-4 h-4 mr-1" /> Add Course
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onSelect={() => setSelected(course)}
                  onEdit={() => openEditCourse(course)}
                  onDelete={() => setDeleteCourseTarget(course)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!loading && selected && (
        <CourseDetail course={selected} onBack={() => setSelected(null)} />
      )}

      <CourseFormDialog
        open={courseFormOpen}
        initial={editingCourse}
        onClose={() => { setCourseFormOpen(false); setEditingCourse(null); }}
        onSaved={(saved, mode) => {
          setCourses((prev) =>
            mode === "create"
              ? [...prev, saved]
              : prev.map((c) => (c.id === saved.id ? saved : c)),
          );
          // If we just edited the open course, keep `selected` in sync.
          setSelected((cur) => (cur && cur.id === saved.id ? saved : cur));
          setCourseFormOpen(false);
          setEditingCourse(null);
        }}
      />

      <Dialog
        open={!!deleteCourseTarget}
        onOpenChange={(v) => { if (!v && !deletingCourse) setDeleteCourseTarget(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete course?</DialogTitle>
            <DialogDescription>
              This will permanently remove "{deleteCourseTarget?.title}" along with all its modules, classes, plans, and enrollments. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={deletingCourse} onClick={() => setDeleteCourseTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deletingCourse} onClick={handleConfirmDeleteCourse}>
              {deletingCourse ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
