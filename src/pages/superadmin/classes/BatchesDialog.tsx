import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Plus, Search, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { listBatches, createBatch, renameBatch, deleteBatch } from "../../../api/batches";
import type { Batch } from "../../../api/types";
import { useClassesRole } from "./classesRole";

interface BatchesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchesDialog({ open, onOpenChange }: BatchesDialogProps) {
  const role = useClassesRole();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [addName, setAddName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    listBatches(role, {
      q: debouncedQuery || undefined,
      page,
      limit: 10,
    })
      .then((res) => {
        if (cancelled) return;
        setBatches(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          toast.error(err instanceof Error ? err.message : "Failed to load batches.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, debouncedQuery, page, refreshKey]);

  // Reset transient state when the dialog closes.
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setAddName("");
      setEditingId(null);
      setEditName("");
      setPage(1);
    }
  }, [open]);

  const refetch = () => setRefreshKey((k) => k + 1);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = addName.trim();
    if (!name || isAdding) return;
    setIsAdding(true);
    try {
      await createBatch(role, name);
      toast.success("Batch created");
      setAddName("");
      setPage(1);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create batch.");
    } finally {
      setIsAdding(false);
    }
  }

  function startEdit(batch: Batch) {
    setEditingId(batch.id);
    setEditName(batch.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function saveEdit(batch: Batch) {
    const next = editName.trim();
    if (!next || isUpdating) return;
    if (next === batch.name) {
      cancelEdit();
      return;
    }
    setIsUpdating(true);
    try {
      await renameBatch(role, batch.id, next);
      toast.success("Batch renamed");
      cancelEdit();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename batch.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete(batch: Batch) {
    if (!confirm(`Delete batch "${batch.name}"? Associated live classes will be unlinked.`)) return;
    try {
      await deleteBatch(role, batch.id);
      toast.success("Batch deleted");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete batch.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 10));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batches</DialogTitle>
          <DialogDescription>
            Group live classes and enrollments into cohorts (e.g. "Morning 7am Bengaluru").
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="flex gap-2 pt-1">
          <Input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            maxLength={100}
            placeholder="New batch name"
            className="flex-1"
          />
          <Button type="submit" disabled={isAdding || !addName.trim()} className="gap-1.5">
            <Plus className="w-4 h-4" />
            {isAdding ? "Adding…" : "Add"}
          </Button>
        </form>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="py-2 px-3 font-medium">Name</th>
                <th className="py-2 px-3 font-medium hidden sm:table-cell">Created</th>
                <th className="py-2 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && batches.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-muted-foreground">
                    {debouncedQuery ? "No batches match your search." : "No batches yet."}
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const editing = editingId === batch.id;
                  return (
                    <tr key={batch.id} className="border-t">
                      <td className="py-2 px-3">
                        {editing ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            maxLength={100}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(batch);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium">{batch.name}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground hidden sm:table-cell">
                        {new Date(batch.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex justify-end gap-1">
                          {editing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isUpdating || !editName.trim()}
                                onClick={() => saveEdit(batch)}
                              >
                                <Check className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={cancelEdit}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => startEdit(batch)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDelete(batch)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {total > 10 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} • {total} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
