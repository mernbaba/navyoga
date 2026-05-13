import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import { Textarea } from "../../../components/ui/textarea";
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
} from "../../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  Users,
  IndianRupee,
  Sparkles,
  ClipboardList,
  Layers,
  Upload,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import {
  listWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  listWorkshopEnrollments,
  removeWorkshopEnrollment,
  requestWorkshopThumbnailPresign,
  type CreateWorkshopInput,
} from "../../../api/workshops";
import type {
  Workshop,
  WorkshopEnrollmentRow,
  WorkshopMode,
  ClassLevel,
} from "../../../api/types";
import { resolveMediaUrl } from "../../../lib/media";

const LIMIT = 15;
const ENROLLMENTS_LIMIT = 20;
const MODES: WorkshopMode[] = ["LIVE", "RECORDED", "HYBRID"];
const LEVELS: ClassLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"];

type WorkshopFormFields = {
  title: string;
  description: string;
  yogaType: string;
  mode: WorkshopMode;
  level: ClassLevel;
  price: string;
  thumbnail: string;
  instructorName: string;
  startDate: string;
  endDate: string;
  totalDuration: string;
  capacity: string;
};

const emptyWorkshopForm = (): WorkshopFormFields => ({
  title: "",
  description: "",
  yogaType: "",
  mode: "LIVE",
  level: "ALL_LEVELS",
  price: "0",
  thumbnail: "",
  instructorName: "",
  startDate: "",
  endDate: "",
  totalDuration: "",
  capacity: "",
});

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function workshopToForm(w: Workshop): WorkshopFormFields {
  return {
    title: w.title,
    description: w.description,
    yogaType: w.yogaType,
    mode: w.mode,
    level: w.level,
    price: w.price,
    thumbnail: w.thumbnail ?? "",
    instructorName: w.instructorName ?? "",
    startDate: toDatetimeLocal(w.startDate),
    endDate: toDatetimeLocal(w.endDate),
    totalDuration: w.totalDuration != null ? String(w.totalDuration) : "",
    capacity: w.capacity != null ? String(w.capacity) : "",
  };
}

function buildWorkshopBody(form: WorkshopFormFields): CreateWorkshopInput {
  const body: CreateWorkshopInput = {
    title: form.title.trim(),
    description: form.description.trim(),
    yogaType: form.yogaType.trim(),
    mode: form.mode,
    level: form.level,
    price: Number(form.price) || 0,
  };
  if (form.thumbnail.trim()) body.thumbnail = form.thumbnail.trim();
  if (form.instructorName.trim()) body.instructorName = form.instructorName.trim();
  const startIso = fromDatetimeLocal(form.startDate);
  if (startIso) body.startDate = startIso;
  const endIso = fromDatetimeLocal(form.endDate);
  if (endIso) body.endDate = endIso;
  if (form.totalDuration.trim()) {
    const n = Number(form.totalDuration);
    if (Number.isFinite(n) && n > 0) body.totalDuration = n;
  }
  if (form.capacity.trim()) {
    const n = Number(form.capacity);
    if (Number.isFinite(n) && n >= 0) body.capacity = n;
  }
  return body;
}

function isWorkshopFormValid(form: WorkshopFormFields): boolean {
  return Boolean(
    form.title.trim() &&
    form.description.trim() &&
    form.yogaType.trim() &&
    form.mode &&
    Number(form.price) >= 0,
  );
}

function modeBadgeColor(mode: WorkshopMode) {
  switch (mode) {
    case "LIVE": return "#ef4444";
    case "RECORDED": return "#3b82f6";
    case "HYBRID": return "#8b5cf6";
  }
}

function levelLabel(level: ClassLevel) {
  return level === "ALL_LEVELS" ? "All Levels" : level.charAt(0) + level.slice(1).toLowerCase();
}

function WorkshopThumb({ src, alt }: { src: string | undefined; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="w-10 h-10 rounded-md bg-linear-to-br from-[#610981]/15 to-[#ff691d]/10 flex items-center justify-center shrink-0">
        <Video className="w-4 h-4 text-[#610981]" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-10 h-10 rounded-md object-cover shrink-0"
      onError={() => setErrored(true)}
    />
  );
}

type FormMode = "create" | "edit";

export function ClassesWorkshops() {
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<WorkshopMode | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkshopFormFields>(emptyWorkshopForm());
  const [saving, setSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailFileUrl, setThumbnailFileUrl] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Workshop | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Enrollments dialog
  const [enrollmentsWorkshop, setEnrollmentsWorkshop] = useState<Workshop | null>(null);
  const [enrollments, setEnrollments] = useState<WorkshopEnrollmentRow[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentsSearch, setEnrollmentsSearch] = useState("");
  const [debouncedEnrollSearch, setDebouncedEnrollSearch] = useState("");
  const [enrollmentsPage, setEnrollmentsPage] = useState(1);
  const [enrollmentsTotal, setEnrollmentsTotal] = useState(0);
  const [enrollmentsTotalPages, setEnrollmentsTotalPages] = useState(1);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedEnrollSearch(enrollmentsSearch), 300);
    return () => clearTimeout(t);
  }, [enrollmentsSearch]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, modeFilter]);

  // Load list
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listWorkshops("SUPERADMIN", {
      page,
      limit: LIMIT,
      q: debouncedSearch || undefined,
      mode: modeFilter === "ALL" ? undefined : modeFilter,
    })
      .then((res) => {
        if (cancelled) return;
        setWorkshops(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load workshops.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, modeFilter]);

  // Load enrollments
  useEffect(() => {
    if (!enrollmentsWorkshop) return;
    let cancelled = false;
    setEnrollmentsLoading(true);
    listWorkshopEnrollments("SUPERADMIN", enrollmentsWorkshop.id, {
      page: enrollmentsPage,
      limit: ENROLLMENTS_LIMIT,
      q: debouncedEnrollSearch || undefined,
    })
      .then((res) => {
        if (cancelled) return;
        setEnrollments(res.items);
        setEnrollmentsTotal(res.total);
        setEnrollmentsTotalPages(res.totalPages);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load enrollments.");
      })
      .finally(() => {
        if (!cancelled) setEnrollmentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enrollmentsWorkshop, enrollmentsPage, debouncedEnrollSearch]);

  // Manage object URL lifetime for the picked thumbnail preview.
  useEffect(() => {
    if (!thumbnailFile) { setThumbnailFileUrl(null); return; }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

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

  function openCreate() {
    setFormMode("create");
    setEditingId(null);
    setForm(emptyWorkshopForm());
    setThumbnailFile(null);
    setFormOpen(true);
  }

  function openEdit(w: Workshop) {
    setFormMode("edit");
    setEditingId(w.id);
    setForm(workshopToForm(w));
    setThumbnailFile(null);
    setFormOpen(true);
  }

  async function uploadThumbnailFor(workshopId: string, file: File): Promise<string> {
    const presign = await requestWorkshopThumbnailPresign("SUPERADMIN", workshopId, {
      filename: file.name,
      contentType: file.type || "image/jpeg",
    });
    const putRes = await fetch(presign.url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "image/jpeg" },
      body: file,
    });
    if (!putRes.ok) throw new Error("Thumbnail upload failed");
    return presign.storePath;
  }

  async function handleSaveWorkshop() {
    if (!isWorkshopFormValid(form)) return;
    setSaving(true);
    try {
      const basePayload = buildWorkshopBody(form);

      if (formMode === "create") {
        // Create first to obtain the workshop ID, then upload thumbnail
        // (S3 key requires the ID).
        const createdWorkshop = await createWorkshop("SUPERADMIN", {
          ...basePayload,
          thumbnail: thumbnailFile ? undefined : basePayload.thumbnail,
        });
        if (thumbnailFile) {
          const thumbnail = await uploadThumbnailFor(createdWorkshop.id, thumbnailFile);
          await updateWorkshop("SUPERADMIN", createdWorkshop.id, { thumbnail });
        }
        toast.success("Workshop created");
      } else if (editingId) {
        let thumbnail = basePayload.thumbnail;
        if (thumbnailFile) {
          thumbnail = await uploadThumbnailFor(editingId, thumbnailFile);
        }
        await updateWorkshop("SUPERADMIN", editingId, { ...basePayload, thumbnail });
        toast.success("Workshop updated");
      }
      setFormOpen(false);
      // refresh
      const res = await listWorkshops("SUPERADMIN", {
        page,
        limit: LIMIT,
        q: debouncedSearch || undefined,
        mode: modeFilter === "ALL" ? undefined : modeFilter,
      });
      setWorkshops(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save workshop.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteWorkshop("SUPERADMIN", deleteTarget.id);
      toast.success("Workshop deleted");
      setDeleteTarget(null);
      setWorkshops((prev) => prev.filter((w) => w.id !== deleteTarget.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete workshop.");
    } finally {
      setDeleting(false);
    }
  }

  function openEnrollments(w: Workshop) {
    setEnrollmentsWorkshop(w);
    setEnrollmentsPage(1);
    setEnrollmentsSearch("");
    setDebouncedEnrollSearch("");
  }

  async function handleRemoveEnrollment(enrollmentId: string) {
    if (!enrollmentsWorkshop) return;
    if (!confirm("Remove this enrollment?")) return;
    try {
      await removeWorkshopEnrollment("SUPERADMIN", enrollmentsWorkshop.id, enrollmentId);
      toast.success("Enrollment removed");
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      setEnrollmentsTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove enrollment.");
    }
  }

  function openSessions(w: Workshop) {
    navigate(`/superadmin/classes/workshops/${w.id}`);
  }

  const totalCapacity = workshops.reduce((sum, w) => sum + (w.capacity ?? 0), 0);
  const totalEnrolled = workshops.reduce((sum, w) => sum + w.enrollmentCount, 0);
  const liveCount = workshops.filter((w) => w.mode === "LIVE").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-linear-to-br from-[#610981] to-[#8b0fa8] shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#610981" }}>
              Workshops
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage live, recorded, and hybrid yoga workshops
            </p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2"
          style={{ background: "#610981", color: "white" }}
        >
          <Plus className="w-4 h-4" /> Add Workshop
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Workshops" value={total} icon={<Layers className="w-5 h-5 text-white" />} gradient="from-orange-500 to-red-500" />
        <StatCard label="Live (this page)" value={liveCount} icon={<Calendar className="w-5 h-5 text-white" />} gradient="from-rose-500 to-pink-500" />
        <StatCard label="Total Capacity" value={totalCapacity} icon={<Users className="w-5 h-5 text-white" />} gradient="from-purple-600 to-pink-600" />
        <StatCard label="Total Enrolled" value={totalEnrolled} icon={<Sparkles className="w-5 h-5 text-white" />} gradient="from-emerald-500 to-teal-500" />
      </div>

      {/* Search + Filter */}
      <Card className="border-0 shadow-md">
        <CardContent className="py-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none z-10" />
            <Input
              placeholder="Search by title, yoga type or description..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant={modeFilter === "ALL" ? "default" : "outline"} size="sm" onClick={() => setModeFilter("ALL")}>
              All
            </Button>
            {MODES.map((m) => (
              <Button
                key={m}
                variant={modeFilter === m ? "default" : "outline"}
                size="sm"
                onClick={() => setModeFilter(m)}
                style={modeFilter === m ? { background: modeBadgeColor(m), color: "white" } : undefined}
              >
                {m}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg" style={{ color: "#ff691d" }}>
            All Workshops <span className="text-sm font-normal text-muted-foreground ml-2">{total} total</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-4">Workshop</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Enrolled</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : workshops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {debouncedSearch || modeFilter !== "ALL" ? "No workshops match your filters." : "No workshops yet."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  workshops.map((w) => (
                    <TableRow
                      key={w.id}
                      className="hover:bg-muted/20 cursor-pointer"
                      onClick={() => openSessions(w)}
                      title="Open sessions"
                    >
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <WorkshopThumb src={resolveMediaUrl(w.thumbnail)} alt={w.title} />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{w.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{w.yogaType}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge style={{ background: modeBadgeColor(w.mode), color: "white" }}>
                          {w.mode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{levelLabel(w.level)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {w.startDate ? formatDate(w.startDate) : "—"}
                        {w.endDate && (<><span className="mx-1">→</span>{formatDate(w.endDate)}</>)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {w.enrollmentCount}
                        {w.capacity != null && <span className="text-muted-foreground">/{w.capacity}</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {Number(w.price) === 0 ? "Free" : (
                          <span className="inline-flex items-center">
                            <IndianRupee className="w-3 h-3" />
                            {Number(w.price).toLocaleString("en-IN")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Enrollments" onClick={() => openEnrollments(w)}>
                            <ClipboardList className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit" onClick={() => openEdit(w)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700" title="Delete" onClick={() => setDeleteTarget(w)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Workshop Dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => { if (!saving) setFormOpen(v); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: "#610981" }}>
              {formMode === "create" ? "Add Workshop" : "Edit Workshop"}
            </DialogTitle>
            <DialogDescription>
              {formMode === "create" ? "Create a new workshop. Sessions can be added after creation." : "Update workshop details."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="ws-title">Title <span className="text-red-500">*</span></Label>
              <Input id="ws-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Sunday Morning Vinyasa Workshop" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ws-desc">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="ws-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What students will learn"
                rows={3}
                className="min-h-20 max-h-40"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ws-yoga">Yoga Type <span className="text-red-500">*</span></Label>
                <Input id="ws-yoga" value={form.yogaType} onChange={(e) => setForm({ ...form, yogaType: e.target.value })} placeholder="e.g. Vinyasa, Hatha" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ws-instructor">Instructor Name</Label>
                <Input id="ws-instructor" value={form.instructorName} onChange={(e) => setForm({ ...form, instructorName: e.target.value })} placeholder="optional · for guest instructors" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Mode <span className="text-red-500">*</span></Label>
                <Select value={form.mode} onValueChange={(v: WorkshopMode) => setForm({ ...form, mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v: ClassLevel) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => <SelectItem key={l} value={l}>{levelLabel(l)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ws-price">Price (₹) <span className="text-red-500">*</span></Label>
                <Input
                  id="ws-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ws-capacity">Capacity</Label>
                <Input
                  id="ws-capacity"
                  type="number"
                  min={0}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  placeholder="optional"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ws-start">Start Date</Label>
                <Input id="ws-start" type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ws-end">End Date</Label>
                <Input id="ws-end" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ws-duration">Total Duration (min)</Label>
              <Input
                id="ws-duration"
                type="number"
                min={0}
                value={form.totalDuration}
                onChange={(e) => setForm({ ...form, totalDuration: e.target.value })}
                placeholder="optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-thumb-pick">
                Thumbnail <span className="text-xs text-muted-foreground font-normal">· optional · .jpg or .png</span>
              </Label>
              {(thumbnailFileUrl || form.thumbnail) && (
                <div className="relative rounded-lg overflow-hidden bg-black/5 aspect-video max-h-48">
                  <img
                    src={thumbnailFileUrl ?? resolveMediaUrl(form.thumbnail)}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/30 transition-colors">
                <input
                  id="ws-thumb-pick"
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="hidden"
                  disabled={saving}
                  onChange={(e) => handleThumbnailChosen(e.target.files?.[0] ?? null)}
                />
                <label htmlFor="ws-thumb-pick" className="cursor-pointer flex flex-col items-center gap-1.5">
                  {thumbnailFile ? (
                    <>
                      <ImageIcon className="w-6 h-6" style={{ color: "#610981" }} />
                      <p className="text-sm font-medium truncate max-w-full px-2">{thumbnailFile.name}</p>
                      <p className="text-xs text-muted-foreground">Click to choose a different image</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {form.thumbnail ? "Click to replace thumbnail" : "Click to upload thumbnail (JPG or PNG)"}
                      </p>
                    </>
                  )}
                </label>
              </div>
              {(thumbnailFile || form.thumbnail) && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={saving}
                    onClick={() => {
                      setThumbnailFile(null);
                      setForm((f) => ({ ...f, thumbnail: "" }));
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Remove
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              disabled={saving || !isWorkshopFormValid(form)}
              onClick={handleSaveWorkshop}
              style={{ background: "#610981", color: "white" }}
            >
              {saving ? "Saving..." : formMode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v && !deleting) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete workshop?</DialogTitle>
            <DialogDescription>
              This will permanently remove "{deleteTarget?.title}" and all its sessions and enrollments. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleting} onClick={handleConfirmDelete}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrollments Dialog */}
      <Dialog open={!!enrollmentsWorkshop} onOpenChange={(v) => { if (!v) setEnrollmentsWorkshop(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" /> Enrollments
            </DialogTitle>
            <DialogDescription className="truncate">
              {enrollmentsWorkshop?.title} · <span className="font-medium text-foreground">{enrollmentsTotal}</span> enrolled
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none z-10" />
            <Input
              placeholder="Search by name, email or phone..."
              className="pl-9"
              value={enrollmentsSearch}
              onChange={(e) => { setEnrollmentsSearch(e.target.value); setEnrollmentsPage(1); }}
            />
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg mt-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-4">Student</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Enrolled On</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollmentsLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    <div className="w-6 h-6 mx-auto border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                  </TableCell></TableRow>
                ) : enrollments.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-sm text-muted-foreground">
                    {debouncedEnrollSearch ? "No students match your search." : "No enrollments yet."}
                  </TableCell></TableRow>
                ) : (
                  enrollments.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#610981]/15 to-[#ff691d]/10 flex items-center justify-center text-[#610981] font-semibold text-xs">
                            {row.student.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-sm font-medium">{row.student.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex flex-col leading-tight">
                          <span>{row.student.email}</span>
                          <span className="text-xs">{row.student.phone ?? "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(row.enrolledAt)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => handleRemoveEnrollment(row.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {enrollmentsTotalPages > 1 && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Page {enrollmentsPage} of {enrollmentsTotalPages}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={enrollmentsPage <= 1} onClick={() => setEnrollmentsPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <Button size="sm" variant="outline" disabled={enrollmentsPage >= enrollmentsTotalPages} onClick={() => setEnrollmentsPage((p) => Math.min(enrollmentsTotalPages, p + 1))}>Next</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

function StatCard({ label, value, icon, gradient }: { label: string; value: number; icon: React.ReactNode; gradient: string }) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`p-2.5 rounded-xl bg-linear-to-br ${gradient} shadow-md`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
