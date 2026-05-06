import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
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
  DialogTrigger,
} from "../../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Switch } from "../../../components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  Layers,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Clock,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import {
  listModules,
  listClasses,
  createClass,
  updateClass,
  deleteClass,
} from "../../../api/selfPaced";
import type { ClassCreateBody, ClassUpdateBody } from "../../../api/selfPaced";
import type { SelfPacedModule, SelfPacedClass } from "../../../api/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClassRow = SelfPacedClass & { moduleName: string };

type SortKey = "title" | "moduleName" | "duration" | "isActive" | "createdAt";
type SortDir = "asc" | "desc";

type ClassFormState = {
  moduleId: string;
  title: string;
  videoUrl: string;
  duration: string;
  description: string;
  thumbnailUrl: string;
  isActive: boolean;
};

const EMPTY_FORM: ClassFormState = {
  moduleId: "",
  title: "",
  videoUrl: "",
  duration: "",
  description: "",
  thumbnailUrl: "",
  isActive: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ClassesSelfPaced() {
  const [modules, setModules] = useState<SelfPacedModule[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<ClassFormState>(EMPTY_FORM);

  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [editForm, setEditForm] = useState<Omit<ClassFormState, "moduleId">>(
    { title: "", videoUrl: "", duration: "", description: "", thumbnailUrl: "", isActive: true }
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    listModules("SUPERADMIN")
      .then(async (mods) => {
        if (cancelled) return;
        setModules(mods);

        const perModule = await Promise.all(
          mods.map((m) => listClasses("SUPERADMIN", m.id).then((cls) =>
            cls.map((c): ClassRow => ({ ...c, moduleName: m.title }))
          ))
        );
        if (!cancelled) setClasses(perModule.flat());
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load classes.");
      })
      .finally(() => !cancelled && setIsLoading(false));

    return () => { cancelled = true; };
  }, [refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  // ─── Sorting ────────────────────────────────────────────────────────────────

  const sorted = useMemo(() => {
    const mult = sortDir === "asc" ? 1 : -1;
    return [...classes].sort((a, b) => {
      switch (sortKey) {
        case "title":        return mult * a.title.localeCompare(b.title);
        case "moduleName":   return mult * a.moduleName.localeCompare(b.moduleName);
        case "duration":     return mult * (a.duration - b.duration);
        case "isActive":     return mult * (Number(a.isActive) - Number(b.isActive));
        case "createdAt":
        default:             return mult * (Date.parse(a.createdAt) - Date.parse(b.createdAt));
      }
    });
  }, [classes, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // ─── Add class ──────────────────────────────────────────────────────────────

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding || !addForm.moduleId) return;
    setIsAdding(true);
    try {
      const body: ClassCreateBody = {
        title: addForm.title,
        videoUrl: addForm.videoUrl,
        duration: Number(addForm.duration),
        isActive: addForm.isActive,
        ...(addForm.description ? { description: addForm.description } : {}),
        ...(addForm.thumbnailUrl ? { thumbnailUrl: addForm.thumbnailUrl } : {}),
      };
      await createClass("SUPERADMIN", addForm.moduleId, body);
      toast.success("Class created");
      setIsAddOpen(false);
      setAddForm(EMPTY_FORM);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create class.");
    } finally {
      setIsAdding(false);
    }
  };

  // ─── Edit class ─────────────────────────────────────────────────────────────

  const openEdit = (cls: ClassRow) => {
    setEditing(cls);
    setEditForm({
      title: cls.title,
      videoUrl: cls.videoUrl,
      duration: String(cls.duration),
      description: cls.description ?? "",
      thumbnailUrl: cls.thumbnailUrl ?? "",
      isActive: cls.isActive,
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || isUpdating) return;
    setIsUpdating(true);
    const body: ClassUpdateBody = {
      title: editForm.title,
      videoUrl: editForm.videoUrl,
      duration: Number(editForm.duration),
      isActive: editForm.isActive,
      ...(editForm.description ? { description: editForm.description } : {}),
      ...(editForm.thumbnailUrl ? { thumbnailUrl: editForm.thumbnailUrl } : {}),
    };
    try {
      await updateClass("SUPERADMIN", editing.moduleId, editing.id, body);
      toast.success("Class updated");
      setEditing(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update class.");
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Delete class ────────────────────────────────────────────────────────────

  const handleDelete = async (cls: ClassRow) => {
    if (!confirm(`Delete class "${cls.title}"?`)) return;
    try {
      await deleteClass("SUPERADMIN", cls.moduleId, cls.id);
      toast.success("Class deleted");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete class.");
    }
  };

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const activeCount = classes.filter((c) => c.isActive).length;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Self Paced</h1>
          <p className="text-muted-foreground mt-1">Manage self-paced video classes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <form onSubmit={handleAdd}>
                <DialogHeader>
                  <DialogTitle>Create Class</DialogTitle>
                  <DialogDescription>Add a new video class to a module</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Module</Label>
                    <Select
                      value={addForm.moduleId}
                      onValueChange={(v) => setAddForm({ ...addForm, moduleId: v })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a module" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <ClassFields
                    form={addForm}
                    onChange={(patch) => setAddForm((f) => ({ ...f, ...patch }))}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isAdding || !addForm.moduleId || !addForm.title || !addForm.videoUrl || !addForm.duration}>
                    {isAdding ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Link to="modules">
            <Button variant="outline" className="gap-2 border-[#610981] text-[#610981] hover:bg-[#610981]/5">
              <Layers className="w-4 h-4" />
              Manage Modules
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Classes</CardTitle>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="text-3xl font-semibold">{classes.length}</div>
          </div>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="text-3xl font-semibold text-green-600">{activeCount}</div>
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

      {/* Classes table */}
      <Card>
        <CardHeader>
          <CardTitle>All Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead label="Title" col="title" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortHead label="Module" col="moduleName" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortHead label="Duration" col="duration" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortHead label="Status" col="isActive" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortHead label="Created" col="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                ) : sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No classes yet.</TableCell>
                  </TableRow>
                ) : (
                  sorted.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{cls.title}</span>
                        </div>
                        {cls.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 ml-6 line-clamp-1">{cls.description}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cls.moduleName}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          {cls.duration} min
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cls.isActive ? "default" : "secondary"}>
                          {cls.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(cls.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(cls)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(cls)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          {editing && (
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Class</DialogTitle>
                <DialogDescription>Module: {editing.moduleName}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <ClassFields
                  form={editForm}
                  onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" disabled={isUpdating}>{isUpdating ? "Saving..." : "Save"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sortable table head ──────────────────────────────────────────────────────

function SortHead({
  label,
  col,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (col: SortKey) => void;
}) {
  const active = sortKey === col;
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() => onSort(col)}
    >
      <span className="flex items-center gap-1.5">
        {label}
        <Icon className={`w-3.5 h-3.5 ${active ? "text-foreground" : "text-muted-foreground/40"}`} />
      </span>
    </TableHead>
  );
}

// ─── Shared class form fields ─────────────────────────────────────────────────

type PartialClassForm = Omit<ClassFormState, "moduleId">;

function ClassFields({
  form,
  onChange,
}: {
  form: Partial<ClassFormState>;
  onChange: (patch: Partial<PartialClassForm>) => void;
}) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="cf-title">Title</Label>
        <Input
          id="cf-title"
          value={form.title ?? ""}
          onChange={(e) => onChange({ title: e.target.value })}
          required
          placeholder="e.g. Sun Salutation — Part 1"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cf-video">Video URL</Label>
        <Input
          id="cf-video"
          value={form.videoUrl ?? ""}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
          required
          placeholder="https://..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="cf-duration">Duration (min)</Label>
          <Input
            id="cf-duration"
            type="number"
            min={1}
            value={form.duration ?? ""}
            onChange={(e) => onChange({ duration: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cf-thumb">Thumbnail URL</Label>
          <Input
            id="cf-thumb"
            value={form.thumbnailUrl ?? ""}
            onChange={(e) => onChange({ thumbnailUrl: e.target.value })}
            placeholder="optional"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cf-desc">Description</Label>
        <Input
          id="cf-desc"
          value={form.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="optional"
        />
      </div>
      <div className="flex items-center gap-3">
        <Switch
          id="cf-active"
          checked={form.isActive ?? true}
          onCheckedChange={(v) => onChange({ isActive: v })}
        />
        <Label htmlFor="cf-active">Active</Label>
      </div>
    </>
  );
}
