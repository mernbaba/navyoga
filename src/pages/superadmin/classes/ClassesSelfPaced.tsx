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
} from "../../../api/selfPaced";
import type { ClassCreateBody } from "../../../api/selfPaced";
import type { SelfPacedModule, SelfPacedClass } from "../../../api/types";

const BRAND = "#610981";

type ModuleWithClasses = SelfPacedModule & { classes: SelfPacedClass[] };

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export function ClassesSelfPaced() {
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
      const mods = await listModules("SUPERADMIN");
      // listModules only bundles isActive: true classes, so re-fetch the full list per module.
      const classesPerModule = await Promise.all(
        mods.map((m) => listClasses("SUPERADMIN", m.id)),
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
      await deleteModule("SUPERADMIN", mod.id);
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
        "SUPERADMIN",
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
      await deleteClass("SUPERADMIN", mod.id, cls.id);
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
        "SUPERADMIN",
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
              <div className="flex items-center">
                <AccordionTrigger className="px-4 py-3 flex-1 hover:no-underline hover:bg-muted/30">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{modIdx + 1}.</span>
                    <FolderOpen className="w-4 h-4 shrink-0" style={{ color: BRAND }} />
                    <span className="font-medium text-sm truncate">{mod.title}</span>
                    <Badge variant="secondary" className="ml-1 shrink-0">
                      {mod.classes.length} class{mod.classes.length !== 1 ? "es" : ""}
                    </Badge>
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
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod); }}
                    title="Delete module"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
      const mod = await createModule("SUPERADMIN", trimmed);
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
      const updated = await updateModule("SUPERADMIN", mod.id, { title: trimmed });
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

function ClassFormView({
  form,
  onChange,
}: {
  form: ClassFormFields;
  onChange: (patch: Partial<ClassFormFields>) => void;
}) {
  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="cf-title">Title *</Label>
        <Input
          id="cf-title"
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Sun Salutation — Part 1"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cf-video">Video URL *</Label>
        <Input
          id="cf-video"
          value={form.video}
          onChange={(e) => onChange({ video: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cf-dur">Duration (min) *</Label>
          <Input
            id="cf-dur"
            type="number"
            min={1}
            value={form.duration}
            onChange={(e) => onChange({ duration: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cf-thumb">Thumbnail URL</Label>
          <Input
            id="cf-thumb"
            value={form.thumbnail}
            onChange={(e) => onChange({ thumbnail: e.target.value })}
            placeholder="optional"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="cf-desc">Description</Label>
        <Input
          id="cf-desc"
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="optional"
        />
      </div>
      <div className="flex items-center gap-3">
        <Switch
          id="cf-active"
          checked={form.isActive}
          onCheckedChange={(v) => onChange({ isActive: v })}
        />
        <Label htmlFor="cf-active">Active</Label>
      </div>
    </>
  );
}

function buildClassBody(form: ClassFormFields): ClassCreateBody {
  return {
    title: form.title.trim(),
    video: form.video.trim(),
    duration: Number(form.duration),
    isActive: form.isActive,
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
    ...(form.thumbnail.trim() ? { thumbnail: form.thumbnail.trim() } : {}),
  };
}

function isClassFormValid(form: ClassFormFields): boolean {
  return Boolean(form.title.trim() && form.video.trim() && Number(form.duration) > 0);
}

// ─── ADD CLASS DIALOG ─────────────────────────────────────────────────────────

function AddClassDialog({
  open,
  mod,
  onClose,
  onCreated,
}: {
  open: boolean;
  mod: SelfPacedModule;
  onClose: () => void;
  onCreated: (cls: SelfPacedClass) => void;
}) {
  const [form, setForm] = useState<ClassFormFields>(EMPTY_CLASS_FORM);
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm(EMPTY_CLASS_FORM);
    setSaving(false);
  }

  async function handleSave() {
    if (!isClassFormValid(form)) return;
    setSaving(true);
    try {
      const cls = await createClass("SUPERADMIN", mod.id, buildClassBody(form));
      toast.success("Class added");
      onCreated(cls);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add class");
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Class</DialogTitle>
          <DialogDescription>
            Adding to module: <span className="font-medium">{mod.title}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <ClassFormView form={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button disabled={!isClassFormValid(form) || saving} onClick={handleSave} style={{ background: BRAND }}>
            {saving ? "Adding…" : "Add Class"}
          </Button>
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
  const [form, setForm] = useState<ClassFormFields>({
    title: cls.title,
    video: cls.video,
    duration: String(cls.duration),
    thumbnail: cls.thumbnail ?? "",
    description: cls.description ?? "",
    isActive: cls.isActive,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      title: cls.title,
      video: cls.video,
      duration: String(cls.duration),
      thumbnail: cls.thumbnail ?? "",
      description: cls.description ?? "",
      isActive: cls.isActive,
    });
    setSaving(false);
  }, [cls.id]);

  async function handleSave() {
    if (!isClassFormValid(form)) return;
    setSaving(true);
    try {
      const updated = await updateClass("SUPERADMIN", mod.id, cls.id, buildClassBody(form));
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
          <DialogDescription>
            Editing in module: <span className="font-medium">{mod.title}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <ClassFormView form={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!isClassFormValid(form) || saving} onClick={handleSave} style={{ background: BRAND }}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
