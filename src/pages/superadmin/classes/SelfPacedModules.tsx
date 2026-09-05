import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
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
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  listModules,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
} from "../../../api/selfPaced";
import type { SelfPacedModule } from "../../../api/types";
import { useClassesRole, useClassesBasePath } from "./classesRole";

export function SelfPacedModules() {
  const role = useClassesRole();
  const classesBase = useClassesBasePath();
  const [modules, setModules] = useState<SelfPacedModule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isReordering, setIsReordering] = useState(false);

  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [addModuleTitle, setAddModuleTitle] = useState("");
  const [isAddingModule, setIsAddingModule] = useState(false);

  const [editingModule, setEditingModule] = useState<SelfPacedModule | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [isUpdatingModule, setIsUpdatingModule] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listModules(role)
      .then((res) => {
        if (!cancelled) setModules(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load modules.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => { cancelled = true; };
  }, [refreshKey]);

  const refetchModules = () => setRefreshKey((k) => k + 1);

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingModule) return;
    setIsAddingModule(true);
    try {
      await createModule(role, addModuleTitle.trim());
      toast.success("Module created");
      setIsAddModuleOpen(false);
      setAddModuleTitle("");
      refetchModules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create module.");
    } finally {
      setIsAddingModule(false);
    }
  };

  const openEditModule = (mod: SelfPacedModule) => {
    setEditingModule(mod);
    setEditModuleTitle(mod.title);
  };

  const handleEditModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule || isUpdatingModule) return;
    setIsUpdatingModule(true);
    try {
      await updateModule(role, editingModule.id, { title: editModuleTitle.trim() });
      toast.success("Module updated");
      setEditingModule(null);
      refetchModules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update module.");
    } finally {
      setIsUpdatingModule(false);
    }
  };

  const handleDeleteModule = async (mod: SelfPacedModule) => {
    if (!confirm(`Delete module "${mod.title}"? All its classes will also be deleted.`)) return;
    try {
      await deleteModule(role, mod.id);
      toast.success("Module deleted");
      refetchModules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete module.");
    }
  };

  const moveModule = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= modules.length) return;

    const reordered = [...modules];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    setModules(reordered);

    setIsReordering(true);
    try {
      await reorderModules(
        role,
        reordered.map((m, i) => ({ id: m.id, sortOrder: i + 1 })),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reorder modules.");
      refetchModules();
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to={`${classesBase}/self-paced`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold">Modules</h1>
            <p className="text-muted-foreground mt-0.5">Self-paced content structure</p>
          </div>
        </div>

        <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddModule}>
              <DialogHeader>
                <DialogTitle>Create Module</DialogTitle>
                <DialogDescription>Add a new content module</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-4">
                <Label htmlFor="mod-title">Module Title</Label>
                <Input
                  id="mod-title"
                  value={addModuleTitle}
                  onChange={(e) => setAddModuleTitle(e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. Introduction to Hatha Yoga"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModuleOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isAddingModule || !addModuleTitle.trim()}>
                  {isAddingModule ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Module list */}
      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Loading modules...</div>
      ) : modules.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          No modules yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {modules.map((mod, idx) => (
            <div
              key={mod.id}
              className="flex items-center gap-3 px-4 py-3 bg-card border rounded-xl"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              <span className="text-xs text-muted-foreground w-5 shrink-0 text-center">{idx + 1}</span>
              <span className="flex-1 font-medium">{mod.title}</span>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={idx === 0 || isReordering}
                  onClick={() => moveModule(idx, "up")}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={idx === modules.length - 1 || isReordering}
                  onClick={() => moveModule(idx, "down")}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModule(mod)}>
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteModule(mod)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit module dialog */}
      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent>
          {editingModule && (
            <form onSubmit={handleEditModule}>
              <DialogHeader>
                <DialogTitle>Rename Module</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 py-4">
                <Label htmlFor="edit-mod-title">Title</Label>
                <Input
                  id="edit-mod-title"
                  value={editModuleTitle}
                  onChange={(e) => setEditModuleTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingModule(null)}>Cancel</Button>
                <Button
                  type="submit"
                  disabled={isUpdatingModule || !editModuleTitle.trim() || editModuleTitle.trim() === editingModule.title}
                >
                  {isUpdatingModule ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
