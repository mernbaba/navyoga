import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import { Switch } from "../../../components/ui/switch";
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
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  Video,
  Clock,
  Upload,
  FileVideo,
  Image as ImageIcon,
  Copy,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  listModules,
  listClasses,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  createClass,
  updateClass,
  deleteClass,
  reorderClasses,
  requestPresignedUrl,
  deleteClassMedia,
} from "../../../api/selfPaced";
import type { ClassCreateBody } from "../../../api/selfPaced";
import { extractRelativePath, resolveMediaUrl } from "../../../lib/media";
import { DownloadMediaButton } from "@/components/media/DownloadMediaButton";
import type { SelfPacedModule, SelfPacedClass } from "../../../api/types";
import { useClassesRole } from "./classesRole";

const BRAND = "#610981";

type ModuleWithClasses = SelfPacedModule & { classes: SelfPacedClass[] };

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export function ClassesSelfPaced() {
  const role = useClassesRole();
  const [modules, setModules] = useState<ModuleWithClasses[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);

  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [renamingModule, setRenamingModule] = useState<ModuleWithClasses | null>(null);
  const [addClassFor, setAddClassFor] = useState<ModuleWithClasses | null>(null);
  const [editingClass, setEditingClass] = useState<{ mod: ModuleWithClasses; cls: SelfPacedClass } | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const mods = await listModules(role);
      // listModules only bundles isActive: true classes, so re-fetch the full list per module.
      const classesPerModule = await Promise.all(
        mods.map((m) => listClasses(role, m.id)),
      );
      setModules(mods.map((m, i) => ({ ...m, classes: classesPerModule[i] })));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load self-paced content.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // ─── Module handlers ────────────────────────────────────────────────────────

  async function handleDeleteModule(mod: ModuleWithClasses) {
    if (!confirm(`Delete module "${mod.title}" and all its classes?`)) return;
    try {
      await deleteModule(role, mod.id);
      toast.success("Module deleted");
      setModules((prev) => prev.filter((m) => m.id !== mod.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete module");
    }
  }

  async function moveModule(index: number, direction: "up" | "down") {
    if (isReordering) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= modules.length) return;

    const previous = modules;
    const reordered = [...previous];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    setModules(reordered);
    setIsReordering(true);
    try {
      await reorderModules(
        role,
        reordered.map((m, i) => ({ id: m.id, sortOrder: i + 1 })),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reorder modules");
      setModules(previous);
    } finally {
      setIsReordering(false);
    }
  }

  // ─── Class handlers ─────────────────────────────────────────────────────────

  async function handleDeleteClass(mod: ModuleWithClasses, cls: SelfPacedClass) {
    if (!confirm(`Delete class "${cls.title}"?`)) return;
    try {
      await deleteClass(role, mod.id, cls.id);
      toast.success("Class deleted");
      setModules((prev) =>
        prev.map((m) =>
          m.id === mod.id ? { ...m, classes: m.classes.filter((c) => c.id !== cls.id) } : m,
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete class");
    }
  }

  async function moveClass(mod: ModuleWithClasses, index: number, direction: "up" | "down") {
    if (isReordering) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= mod.classes.length) return;

    const previousClasses = mod.classes;
    const reordered = [...previousClasses];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    setModules((prev) => prev.map((m) => (m.id === mod.id ? { ...m, classes: reordered } : m)));
    setIsReordering(true);
    try {
      await reorderClasses(
        role,
        mod.id,
        reordered.map((c, i) => ({ id: c.id, sortOrder: i + 1 })),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reorder classes");
      setModules((prev) =>
        prev.map((m) => (m.id === mod.id ? { ...m, classes: previousClasses } : m)),
      );
    } finally {
      setIsReordering(false);
    }
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const totalClasses = modules.reduce((acc, m) => acc + m.classes.length, 0);
  const activeClasses = modules.reduce(
    (acc, m) => acc + m.classes.filter((c) => c.isActive).length,
    0,
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Self Paced</h1>
          <p className="text-muted-foreground mt-1">Manage self-paced video classes</p>
        </div>
        <Button onClick={() => setAddModuleOpen(true)} style={{ background: BRAND }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Module
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Classes</CardTitle>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="text-3xl font-semibold">{totalClasses}</div>
          </div>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="text-3xl font-semibold text-green-600">{activeClasses}</div>
          </div>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Modules</CardTitle>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="text-3xl font-semibold">{modules.length}</div>
          </div>
        </Card>
      </div>

      {/* Modules + classes */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading…</div>
      ) : modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border/60 gap-3">
          <FolderOpen className="w-10 h-10 text-[#610981]/25" />
          <p className="text-sm text-muted-foreground">No modules yet. Add a module to start organising classes.</p>
          <Button size="sm" onClick={() => setAddModuleOpen(true)} style={{ background: BRAND }}>
            <Plus className="w-4 h-4 mr-1" />
            Add Module
          </Button>
        </div>
      ) : (
        <Accordion
          type="multiple"
          defaultValue={modules.map((m) => m.id)}
          className="space-y-3"
        >
          {modules.map((mod, modIdx) => (
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
                    <Badge variant="secondary" className="ml-1 shrink-0">
                      {mod.classes.length} class{mod.classes.length !== 1 ? "es" : ""}
                    </Badge>
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
                    disabled={modIdx === modules.length - 1 || isReordering}
                    onClick={(e) => { e.stopPropagation(); moveModule(modIdx, "down"); }}
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); setRenamingModule(mod); }}
                    title="Rename"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {mod.classes.length === 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod); }}
                      title="Delete module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
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
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm truncate">{cls.title}</span>
                          {!cls.isActive && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Inactive</Badge>
                          )}
                        </div>
                        {cls.description && (
                          <p className="text-xs text-muted-foreground truncate">{cls.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {cls.duration}m
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
                        onClick={() => handleDeleteClass(mod, cls)}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  {mod.classes.length === 0 && (
                    <div className="pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setAddClassFor(mod)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Class
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Dialogs */}
      <AddModuleDialog
        open={addModuleOpen}
        onClose={() => setAddModuleOpen(false)}
        onCreated={(mod) => {
          setModules((prev) => [...prev, { ...mod, classes: [] }]);
          setAddModuleOpen(false);
        }}
      />

      {renamingModule && (
        <RenameModuleDialog
          open={!!renamingModule}
          mod={renamingModule}
          onClose={() => setRenamingModule(null)}
          onUpdated={(updated) => {
            setModules((prev) => prev.map((m) => (m.id === updated.id ? { ...m, title: updated.title } : m)));
            setRenamingModule(null);
          }}
        />
      )}

      {addClassFor && (
        <AddClassDialog
          open={!!addClassFor}
          mod={addClassFor}
          onClose={() => setAddClassFor(null)}
          onCreated={(cls) => {
            const targetId = addClassFor.id;
            setModules((prev) =>
              prev.map((m) => (m.id === targetId ? { ...m, classes: [...m.classes, cls] } : m)),
            );
            setAddClassFor(null);
          }}
        />
      )}

      {editingClass && (
        <EditClassDialog
          open={!!editingClass}
          mod={editingClass.mod}
          cls={editingClass.cls}
          onClose={() => setEditingClass(null)}
          onUpdated={(updated) => {
            const targetModuleId = editingClass.mod.id;
            setModules((prev) =>
              prev.map((m) =>
                m.id === targetModuleId
                  ? { ...m, classes: m.classes.map((c) => (c.id === updated.id ? updated : c)) }
                  : m,
              ),
            );
            setEditingClass(null);
          }}
        />
      )}
    </div>
  );
}

// ─── ADD MODULE DIALOG ────────────────────────────────────────────────────────

function AddModuleDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (mod: SelfPacedModule) => void;
}) {
  const role = useClassesRole();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle("");
    setSaving(false);
  }

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const mod = await createModule(role, trimmed);
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
          <DialogDescription>Group classes under a module (e.g. "Restorative & Recovery").</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="sp-mod-title">Module Title *</Label>
            <Input
              id="sp-mod-title"
              autoFocus
              placeholder="e.g. Restorative & Recovery"
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

// ─── RENAME MODULE DIALOG ─────────────────────────────────────────────────────

function RenameModuleDialog({
  open,
  mod,
  onClose,
  onUpdated,
}: {
  open: boolean;
  mod: SelfPacedModule;
  onClose: () => void;
  onUpdated: (mod: SelfPacedModule) => void;
}) {
  const role = useClassesRole();
  const [title, setTitle] = useState(mod.title);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(mod.title);
    setSaving(false);
  }, [mod.id, mod.title]);

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === mod.title) return;
    setSaving(true);
    try {
      const updated = await updateModule(role, mod.id, { title: trimmed });
      toast.success("Module renamed");
      onUpdated(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename module");
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename Module</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="sp-rename-title">Title *</Label>
            <Input
              id="sp-rename-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!title.trim() || title.trim() === mod.title || saving}
            onClick={handleSave}
            style={{ background: BRAND }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── CLASS FORM (shared by Add + Edit) ────────────────────────────────────────

type ClassFormFields = {
  title: string;
  video: string;
  duration: string;
  thumbnail: string;
  description: string;
  isActive: boolean;
};

const EMPTY_CLASS_FORM: ClassFormFields = {
  title: "",
  video: "",
  duration: "",
  thumbnail: "",
  description: "",
  isActive: true,
};

const THUMBNAIL_URL_PATTERN = /\.(jpe?g|png)(\?.*)?$/i;
function isValidThumbnailUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return THUMBNAIL_URL_PATTERN.test(trimmed);
}

function ClassFormView({
  form,
  onChange,
  showActive = true,
  showThumbnail = true,
}: {
  form: ClassFormFields;
  onChange: (patch: Partial<ClassFormFields>) => void;
  showActive?: boolean;
  showThumbnail?: boolean;
}) {
  const thumbInvalid = showThumbnail && !isValidThumbnailUrl(form.thumbnail);
  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="cf-title">Title *</Label>
        <Input
          id="cf-title"
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Sun Salutation - Part 1"
        />
      </div>
      <div className={showThumbnail ? "grid grid-cols-2 gap-3" : ""}>
        <div className="space-y-1">
          <Label htmlFor="cf-dur">Duration (min) *</Label>
          <Input
            id="cf-dur"
            type="number"
            min={1}
            step={1}
            value={form.duration}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^\d+$/.test(v)) onChange({ duration: v });
            }}
            onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "+") e.preventDefault(); }}
          />
          {form.duration !== "" && Number(form.duration) <= 0 && (
            <p className="text-xs text-red-500">Duration must be a positive number</p>
          )}
        </div>
        {showThumbnail && (
          <div className="space-y-1">
            <Label htmlFor="cf-thumb">Thumbnail URL</Label>
            <Input
              id="cf-thumb"
              value={form.thumbnail}
              onChange={(e) => onChange({ thumbnail: e.target.value })}
              placeholder="optional · .jpg or .png URL"
            />
            {thumbInvalid && (
              <p className="text-xs text-red-500">Only .jpg or .png URLs are allowed</p>
            )}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="cf-desc">Description</Label>
        <textarea
          id="cf-desc"
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="optional · what sādhakas will learn"
          rows={3}
          className="w-full min-h-20 max-h-40 px-3 py-2 rounded-md border border-gray-200 bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring resize-y"
        />
      </div>
      {showActive && (
        <div className="flex items-center gap-3">
          <Switch
            id="cf-active"
            checked={form.isActive}
            onCheckedChange={(v) => onChange({ isActive: v })}
          />
          <Label htmlFor="cf-active">Active</Label>
        </div>
      )}
    </>
  );
}

function buildClassBody(form: ClassFormFields): ClassCreateBody {
  return {
    title: form.title.trim(),
    duration: Number(form.duration),
    isActive: form.isActive,
    ...(form.video.trim() ? { video: form.video.trim() } : {}),
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
    ...(form.thumbnail.trim() ? { thumbnail: form.thumbnail.trim() } : {}),
  };
}

function isClassFormValid(form: ClassFormFields): boolean {
  return Boolean(form.title.trim() && Number(form.duration) > 0);
}

// ─── ADD CLASS DIALOG ─────────────────────────────────────────────────────────

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
      // Seek to ~10% in (or 1s, whichever larger) to skip black intros
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

function AddClassDialog({
  open,
  mod,
  onClose,
  onCreated,
}: {
  open: boolean;
  mod: ModuleWithClasses;
  onClose: () => void;
  onCreated: (cls: SelfPacedClass) => void;
}) {
  const role = useClassesRole();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<ClassFormFields>(EMPTY_CLASS_FORM);
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
    setForm(EMPTY_CLASS_FORM);
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
      setForm((f) => ({ ...f, duration: String(minutes) }));
      // Keep the captured frame around even if a URL was given - user might clear the URL.
      setAutoThumb(thumbnail);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't read the video");
    } finally {
      setExtracting(false);
    }
  }

  async function handlePublish() {
    if (!isClassFormValid(form) || (!videoFile && !pastedVideoPath.trim())) return;
    setSaving(true);
    let createdId: string | null = null;
    try {
      const cls = await createClass(role, mod.id, buildClassBody(form));
      createdId = cls.id;

      let updated: SelfPacedClass;

      if (videoFile) {
        const videoPresign = await requestPresignedUrl(
          role, mod.id, cls.id, videoFile.name, videoFile.type, "video",
        );
        await fetch(videoPresign.url, {
          method: "PUT",
          headers: { "Content-Type": videoFile.type },
          body: videoFile,
        });
        updated = await updateClass(role, mod.id, cls.id, { video: videoPresign.storePath });
      } else {
        // Reuse an existing path directly - no upload needed.
        updated = await updateClass(role, mod.id, cls.id, { video: pastedVideoPath.trim() });
      }

      // Prefer user-uploaded thumbnail file; fall back to the frame captured from the video.
      const thumbBlob: Blob | null = thumbnailFile ?? autoThumb;
      if (thumbBlob) {
        const thumbName = thumbnailFile?.name ?? "thumbnail.jpg";
        const thumbType = thumbnailFile?.type || "image/jpeg";
        try {
          const thumbPresign = await requestPresignedUrl(
            role, mod.id, cls.id, thumbName, thumbType, "thumbnail",
          );
          await fetch(thumbPresign.url, {
            method: "PUT",
            headers: { "Content-Type": thumbType },
            body: thumbBlob,
          });
          updated = await updateClass(role, mod.id, cls.id, { thumbnail: thumbPresign.storePath });
        } catch (thumbErr) {
          toast.error(
            thumbErr instanceof Error
              ? `Class created, but thumbnail upload failed: ${thumbErr.message}.`
              : "Thumbnail upload failed.",
          );
        }
      }

      toast.success("Class added");
      onCreated(updated);
      reset();
    } catch (err) {
      if (createdId) {
        try { await deleteClass(role, mod.id, createdId); } catch { /* swallow */ }
      }
      toast.error(err instanceof Error ? err.message : "Failed to add class");
      setSaving(false);
    }
  }

  const detailsValid = isClassFormValid(form);
  const previewImageUrl = thumbnailFileUrl || autoThumbUrl;
  const displayDuration = detectedDurationMin ?? (form.duration ? Number(form.duration) : null);

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
              : <>Adding to module: <span className="font-medium">{mod.title}</span></>}
            <span className="ml-2 text-xs text-muted-foreground">· Step {step} of 2</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {step === 1 ? (
            <div className="space-y-3">
              <ClassFormView
                form={form}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                showActive={false}
                showThumbnail={false}
              />
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
                      {form.title.trim() || "Untitled class"}
                    </p>
                    <p className="text-white/70 text-xs mt-0.5 truncate">
                      {mod.title} · {displayDuration ? `${displayDuration} min` : "-"} · MP4
                    </p>
                  </div>
                </div>
              </div>

              {/* Thumbnail upload - optional, .jpg/.png only */}
              <div className="space-y-2">
                <Label htmlFor="sp-thumb-pick">
                  Thumbnail <span className="text-xs text-muted-foreground font-normal">· optional · .jpg or .png</span>
                </Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/30 transition-colors">
                  <input
                    id="sp-thumb-pick"
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className="hidden"
                    disabled={saving}
                    onChange={(e) => handleThumbnailChosen(e.target.files?.[0] ?? null)}
                  />
                  <label htmlFor="sp-thumb-pick" className="cursor-pointer flex flex-col items-center gap-1.5">
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
                <Label htmlFor="sp-video-pick">
                  Video File <span className="text-red-500">*</span>
                </Label>
                {pasteVideoMode ? (
                  <div className="space-y-1.5">
                    <Input
                      placeholder="Paste a video path, e.g. /self-paced/abc-123/video.mp4"
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
                        id="sp-video-pick"
                        type="file"
                        accept=".mp4,video/mp4"
                        className="hidden"
                        disabled={saving}
                        onChange={(e) => handleVideoChosen(e.target.files?.[0] ?? null)}
                      />
                      <label htmlFor="sp-video-pick" className="cursor-pointer flex flex-col items-center gap-1.5">
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
                disabled={(!videoFile && !pastedVideoPath.trim()) || saving || !isValidThumbnailUrl(form.thumbnail)}
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

function EditClassDialog({
  open,
  mod,
  cls,
  onClose,
  onUpdated,
}: {
  open: boolean;
  mod: SelfPacedModule;
  cls: SelfPacedClass;
  onClose: () => void;
  onUpdated: (cls: SelfPacedClass) => void;
}) {
  const role = useClassesRole();
  const [form, setForm] = useState<ClassFormFields>({
    title: cls.title,
    video: cls.video,
    duration: String(cls.duration),
    thumbnail: cls.thumbnail ?? "",
    description: cls.description ?? "",
    isActive: cls.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pastePathMode, setPastePathMode] = useState(false);
  const [pastedPath, setPastedPath] = useState("");
  const [applyingPath, setApplyingPath] = useState(false);
  const [videoCopied, setVideoCopied] = useState(false);
  const [detectedDurationMin, setDetectedDurationMin] = useState<number | null>(null);
  const [autoThumb, setAutoThumb] = useState<Blob | null>(null);
  const [autoThumbUrl, setAutoThumbUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailFileUrl, setThumbnailFileUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm({
      title: cls.title,
      video: cls.video,
      duration: String(cls.duration),
      thumbnail: cls.thumbnail ?? "",
      description: cls.description ?? "",
      isActive: cls.isActive,
    });
    setVideoFile(null);
    setPastePathMode(false);
    setPastedPath("");
    setVideoCopied(false);
    setDetectedDurationMin(null);
    setAutoThumb(null);
    setThumbnailFile(null);
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

  useEffect(() => {
    if (!thumbnailFile) { setThumbnailFileUrl(null); return; }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

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
      setForm((f) => ({ ...f, duration: String(minutes) }));
      setAutoThumb(thumbnail);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't read the video");
    } finally {
      setExtracting(false);
    }
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

  async function handleUploadVideo() {
    if (!videoFile) return;
    setUploading(true);
    try {
      if (cls.video) {
        await deleteClassMedia(role, mod.id, cls.id);
      }
      const videoPresign = await requestPresignedUrl(
        role, mod.id, cls.id, videoFile.name, videoFile.type, "video",
      );
      await fetch(videoPresign.url, {
        method: "PUT",
        headers: { "Content-Type": videoFile.type },
        body: videoFile,
      });
      let updated = await updateClass(role, mod.id, cls.id, { video: videoPresign.storePath });

      // Auto-upload captured thumbnail if user hasn't supplied a custom URL
      if (autoThumb && !form.thumbnail.trim()) {
        try {
          const thumbPresign = await requestPresignedUrl(
            role, mod.id, cls.id, "thumbnail.jpg", "image/jpeg", "thumbnail",
          );
          await fetch(thumbPresign.url, {
            method: "PUT",
            headers: { "Content-Type": "image/jpeg" },
            body: autoThumb,
          });
          updated = await updateClass(role, mod.id, cls.id, { thumbnail: thumbPresign.storePath });
        } catch { /* non-fatal */ }
      }

      // Persist auto-detected duration if it changed
      if (detectedDurationMin && detectedDurationMin !== updated.duration) {
        updated = await updateClass(role, mod.id, cls.id, { duration: detectedDurationMin });
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
      const updated = await deleteClassMedia(role, mod.id, cls.id);
      onUpdated(updated);
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
      const updated = await updateClass(role, mod.id, cls.id, { video: path });
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
    if (!isClassFormValid(form)) return;
    setSaving(true);
    try {
      let updated = await updateClass(role, mod.id, cls.id, buildClassBody(form));

      if (thumbnailFile) {
        const thumbName = thumbnailFile.name || "thumbnail.jpg";
        const thumbType = thumbnailFile.type || "image/jpeg";
        const thumbPresign = await requestPresignedUrl(
          role, mod.id, cls.id, thumbName, thumbType, "thumbnail",
        );
        await fetch(thumbPresign.url, {
          method: "PUT",
          headers: { "Content-Type": thumbType },
          body: thumbnailFile,
        });
        updated = await updateClass(role, mod.id, cls.id, { thumbnail: thumbPresign.storePath });
      }

      toast.success("Class updated");
      onUpdated(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update class");
      setSaving(false);
    }
  }

  const [step, setStep] = useState<1 | 2>(1);
  useEffect(() => { setStep(1); }, [cls.id]);

  const previewImageUrl = autoThumbUrl ?? resolveMediaUrl(form.thumbnail.trim() || cls.thumbnail) ?? null;
  const displayDuration = detectedDurationMin ?? (form.duration ? Number(form.duration) : null);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !saving && !uploading) onClose(); }}>
      <DialogContent className={`${step === 2 ? "max-w-lg" : "max-w-md"} max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden`}>
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
          <DialogTitle style={step === 2 ? { color: BRAND } : undefined}>
            {step === 2 ? "Class Video" : "Edit Class"}
          </DialogTitle>
          <DialogDescription>
            {step === 2
              ? "Replace or remove the uploaded video"
              : <>Editing in module: <span className="font-medium">{mod.title}</span></>}
            <span className="ml-2 text-xs text-muted-foreground">· Step {step} of 2</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {step === 1 ? (
            <div className="space-y-3">
              <ClassFormView
                form={form}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                showThumbnail={false}
              />

              {/* Thumbnail upload - from device, .jpg/.png only */}
              <div className="space-y-2">
                <Label htmlFor="ec-thumb-pick">
                  Thumbnail <span className="text-xs text-muted-foreground font-normal">· optional · .jpg or .png</span>
                </Label>
                {(() => {
                  const preview = thumbnailFileUrl ?? resolveMediaUrl(cls.thumbnail || form.thumbnail.trim()) ?? null;
                  return preview ? (
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                      <img
                        key={preview}
                        src={preview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover opacity-90"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  ) : null;
                })()}
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/30 transition-colors">
                  <input
                    id="ec-thumb-pick"
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className="hidden"
                    disabled={saving}
                    onChange={(e) => handleThumbnailChosen(e.target.files?.[0] ?? null)}
                  />
                  <label htmlFor="ec-thumb-pick" className="cursor-pointer flex flex-col items-center gap-1.5">
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
                          {cls.thumbnail ? "Click to replace thumbnail" : "Click to upload thumbnail"}
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
                      {form.title.trim() || "Untitled class"}
                    </p>
                    <p className="text-white/70 text-xs mt-0.5 truncate">
                      {mod.title} · {displayDuration ? `${displayDuration} min` : "-"} · MP4
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
                disabled={!isClassFormValid(form) || saving}
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
