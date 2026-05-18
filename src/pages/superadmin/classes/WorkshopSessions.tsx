import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  ListVideo,
  Save,
  Copy,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { extractRelativePath } from "../../../lib/media";
import {
  getWorkshop,
  addWorkshopSession,
  updateWorkshopSession,
  deleteWorkshopSession,
  type CreateSessionInput,
} from "../../../api/workshops";
import type {
  WorkshopWithSessions,
  WorkshopSession,
  WorkshopMode,
} from "../../../api/types";

type SessionMode = "LIVE" | "RECORDED";
const MODES: SessionMode[] = ["LIVE", "RECORDED"];

type SessionFormFields = {
  title: string;
  sortOrder: string;
  mode: SessionMode;
  scheduledAt: string;
  duration: string;
  link: string;
  video: string;
};

function emptySessionForm(workshopMode: WorkshopMode): SessionFormFields {
  return {
    title: "",
    sortOrder: "",
    mode: workshopMode === "RECORDED" ? "RECORDED" : "LIVE",
    scheduledAt: "",
    duration: "",
    link: "",
    video: "",
  };
}

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

function modeBadgeColor(mode: WorkshopMode) {
  switch (mode) {
    case "LIVE": return "#ef4444";
    case "RECORDED": return "#3b82f6";
    case "HYBRID": return "#8b5cf6";
  }
}

type EditorMode = { kind: "closed" } | { kind: "create" } | { kind: "edit"; sessionId: string };

export function WorkshopSessions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workshop, setWorkshop] = useState<WorkshopWithSessions | null>(null);
  const [sessions, setSessions] = useState<WorkshopSession[]>([]);
  const [loading, setLoading] = useState(true);

  const [editor, setEditor] = useState<EditorMode>({ kind: "closed" });
  const [form, setForm] = useState<SessionFormFields>(emptySessionForm("LIVE"));
  const [saving, setSaving] = useState(false);
  const [videoCopied, setVideoCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getWorkshop("SUPERADMIN", id)
      .then((res) => {
        if (cancelled) return;
        setWorkshop(res);
        setSessions([...res.sessions].sort((a, b) => a.sortOrder - b.sortOrder));
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load workshop.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function openCreate() {
    if (!workshop) return;
    setForm({
      ...emptySessionForm(workshop.mode),
      sortOrder: String(sessions.length + 1),
    });
    setEditor({ kind: "create" });
  }

  function openEdit(s: WorkshopSession) {
    setForm({
      title: s.title,
      sortOrder: String(s.sortOrder),
      mode: s.mode === "RECORDED" ? "RECORDED" : "LIVE",
      scheduledAt: toDatetimeLocal(s.scheduledAt),
      duration: s.duration != null ? String(s.duration) : "",
      link: s.link ?? "",
      video: s.video ?? "",
    });
    setEditor({ kind: "edit", sessionId: s.id });
  }

  function closeEditor() {
    if (saving) return;
    setEditor({ kind: "closed" });
  }

  async function handleSave() {
    if (!id || editor.kind === "closed") return;
    if (!form.title.trim()) return;
    const sortOrder = Number(form.sortOrder);
    if (!Number.isFinite(sortOrder) || sortOrder < 0) return;

    const hasLink = !!form.link.trim();
    const hasVideo = !!form.video.trim();
    if (form.mode === "LIVE" && !hasLink) {
      toast.error("Join link is required for live sessions");
      return;
    }
    if (form.mode === "RECORDED" && !hasVideo) {
      toast.error("Recording URL is required for recorded sessions");
      return;
    }

    setSaving(true);
    try {
      const body: CreateSessionInput = {
        title: form.title.trim(),
        sortOrder,
        mode: form.mode,
      };
      const scheduledIso = fromDatetimeLocal(form.scheduledAt);
      if (scheduledIso) body.scheduledAt = scheduledIso;
      if (form.duration.trim()) {
        const n = Number(form.duration);
        if (Number.isFinite(n) && n > 0) body.duration = n;
      }
      if (form.link.trim()) body.link = form.link.trim();
      if (form.video.trim()) body.video = form.video.trim();

      if (editor.kind === "create") {
        const created = await addWorkshopSession("SUPERADMIN", id, body);
        setSessions((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
        toast.success("Session added");
      } else {
        const updated = await updateWorkshopSession("SUPERADMIN", id, editor.sessionId, body);
        setSessions((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s)).sort((a, b) => a.sortOrder - b.sortOrder),
        );
        toast.success("Session updated");
      }
      setEditor({ kind: "closed" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save session.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: WorkshopSession) {
    if (!id) return;
    if (!confirm(`Delete session "${s.title}"?`)) return;
    try {
      await deleteWorkshopSession("SUPERADMIN", id, s.id);
      setSessions((prev) => prev.filter((x) => x.id !== s.id));
      if (editor.kind === "edit" && editor.sessionId === s.id) setEditor({ kind: "closed" });
      toast.success("Session deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete session.");
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-75 text-muted-foreground text-sm">
        Loading workshop…
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <Link to="/superadmin/classes/workshops">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Workshops
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground">Workshop not found.</p>
      </div>
    );
  }

  const editorOpen = editor.kind !== "closed";

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 mt-0.5"
          onClick={() => navigate("/superadmin/classes/workshops")}
          title="Back to workshops"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2.5 rounded-2xl bg-linear-to-br from-[#610981] to-[#8b0fa8] shadow-lg shrink-0">
            <ListVideo className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate" style={{ color: "#610981" }}>
              {workshop.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {workshop.yogaType} · {sessions.length} session{sessions.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0" style={{ background: "#610981", color: "white" }}>
          <Plus className="w-4 h-4" /> Add Session
        </Button>
      </div>

      {/* Session form modal */}
      <Dialog open={editorOpen} onOpenChange={(o) => { if (!o) closeEditor(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader className="min-w-0">
            <DialogTitle style={{ color: "#610981" }}>
              {editor.kind === "create" ? "Add Session" : "Edit Session"}
            </DialogTitle>
            <DialogDescription>
              {editor.kind === "create"
                ? "Create a new session for this workshop."
                : "Update the session details."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 min-w-0">
            {/* Row 1: Title (full) */}
            <div className="space-y-1.5">
              <Label htmlFor="ses-title" className="text-xs font-medium">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ses-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Track 1 — Sound Bath Journey"
                autoFocus
              />
            </div>

            {/* Row 2: Order · Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ses-order" className="text-xs font-medium">
                  Order <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ses-order"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Mode</Label>
                <Select value={form.mode} onValueChange={(v: SessionMode) => setForm({ ...form, mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Scheduled · Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ses-when" className="text-xs font-medium">Scheduled At</Label>
                <Input
                  id="ses-when"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ses-dur" className="text-xs font-medium">Duration (min)</Label>
                <Input
                  id="ses-dur"
                  type="number"
                  min={0}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 45"
                />
              </div>
            </div>

            {/* Row 4: Join Link · Recording URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ses-link" className="text-xs font-medium">
                  Join Link
                  {form.mode === "LIVE" && <span className="text-red-500"> *</span>}
                </Label>
                <Input
                  id="ses-link"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder={form.mode === "LIVE" ? "required · live join URL" : "optional · live join URL"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ses-video" className="text-xs font-medium">
                  Recording URL
                  {form.mode === "RECORDED" && <span className="text-red-500"> *</span>}
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    id="ses-video"
                    value={form.video}
                    onChange={(e) => setForm({ ...form, video: e.target.value })}
                    placeholder={form.mode === "RECORDED" ? "required · recording URL" : "optional · recording URL"}
                  />
                  {form.video.trim() && (
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 shrink-0"
                      title="Copy path"
                      onClick={() => {
                        navigator.clipboard.writeText(extractRelativePath(form.video));
                        setVideoCopied(true);
                        setTimeout(() => setVideoCopied(false), 1500);
                      }}
                    >
                      {videoCopied
                        ? <CheckCheck className="w-3.5 h-3.5 text-green-600" />
                        : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={saving} onClick={closeEditor}>Cancel</Button>
            <Button
              disabled={saving || !form.title.trim()}
              onClick={handleSave}
              style={{ background: "#610981", color: "white" }}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : editor.kind === "create" ? "Add Session" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sessions table */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg" style={{ color: "#ff691d" }}>
            Sessions <span className="text-sm font-normal text-muted-foreground ml-2">{sessions.length} total</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-4 w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                      No sessions yet. Click "Add Session" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((s) => {
                    const isEditing = editor.kind === "edit" && editor.sessionId === s.id;
                    return (
                      <TableRow key={s.id} className={isEditing ? "bg-purple-50/60" : undefined}>
                        <TableCell className="pl-4 text-xs text-muted-foreground">{s.sortOrder}</TableCell>
                        <TableCell className="text-sm font-medium">{s.title}</TableCell>
                        <TableCell>
                          <Badge style={{ background: modeBadgeColor(s.mode), color: "white" }}>{s.mode}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {s.scheduledAt ? new Date(s.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {s.duration != null ? `${s.duration} min` : "—"}
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => openEdit(s)}
                              title="Edit session"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(s)}
                              title="Delete session"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
