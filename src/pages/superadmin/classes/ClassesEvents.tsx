import { useEffect, useState } from "react";
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
import { Checkbox } from "../../../components/ui/checkbox";
import { Progress } from "../../../components/ui/progress";
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
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  Users,
  Star,
  Clock,
  IndianRupee,
  Sparkles,
  TrendingUp,
  ClipboardList,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  listEventEnrollments,
  requestEventThumbnailPresign,
  type CreateEventInput,
} from "../../../api/events";
import type { AppEvent, EventEnrollmentRow } from "../../../api/types";
import { resolveMediaUrl } from "../../../lib/media";
import { useClassesRole } from "./classesRole";

const LIMIT = 15;

const emptyForm = (): CreateEventInput => ({
  title: "",
  description: "",
  date: "",
  duration: "",
  location: "",
  capacity: 1,
  price: 0,
  thumbnail: "",
  featured: false,
});

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function capacityColor(occupancy: number, capacity: number) {
  const pct = capacity > 0 ? occupancy / capacity : 0;
  if (pct >= 1) return "text-red-600";
  if (pct >= 0.8) return "text-orange-500";
  return "text-emerald-600";
}

function capacityLabel(occupancy: number, capacity: number) {
  if (capacity <= 0) return "N/A";
  if (occupancy >= capacity) return "Full";
  const remaining = capacity - occupancy;
  return `${remaining} left`;
}

type FormMode = "create" | "edit";

export function ClassesEvents() {
  const role = useClassesRole();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filterFeatured, setFilterFeatured] = useState<"" | "true" | "false">("");

  const [dialogMode, setDialogMode] = useState<FormMode>("create");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateEventInput>(emptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailFileUrl, setThumbnailFileUrl] = useState<string | null>(null);

  const [viewEvent, setViewEvent] = useState<AppEvent | null>(null);

  const [enrollmentsEvent, setEnrollmentsEvent] = useState<AppEvent | null>(null);
  const [enrollments, setEnrollments] = useState<EventEnrollmentRow[]>([]);
  const [enrollmentsTotal, setEnrollmentsTotal] = useState(0);
  const [enrollmentsPage, setEnrollmentsPage] = useState(1);
  const [enrollmentsSearch, setEnrollmentsSearch] = useState("");
  const [enrollmentsDebouncedSearch, setEnrollmentsDebouncedSearch] = useState("");
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  useEffect(() => {
    const h = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(h);
  }, [searchQuery]);

  useEffect(() => {
    const h = setTimeout(() => setEnrollmentsDebouncedSearch(enrollmentsSearch.trim()), 300);
    return () => clearTimeout(h);
  }, [enrollmentsSearch]);

  useEffect(() => {
    if (!enrollmentsEvent) return;
    let cancelled = false;
    setEnrollmentsLoading(true);
    listEventEnrollments(role, enrollmentsEvent.id, {
      q: enrollmentsDebouncedSearch || undefined,
      page: enrollmentsPage,
      limit: 20,
    })
      .then((res) => {
        if (cancelled) return;
        setEnrollments(res.items);
        setEnrollmentsTotal(res.total);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          toast.error(err instanceof Error ? err.message : "Failed to load enrollments.");
      })
      .finally(() => !cancelled && setEnrollmentsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [enrollmentsEvent, enrollmentsDebouncedSearch, enrollmentsPage]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listEvents(role, {
      q: debouncedQuery || undefined,
      featured: filterFeatured !== "" ? filterFeatured === "true" : undefined,
      page,
      limit: LIMIT,
    })
      .then((res) => {
        if (cancelled) return;
        setEvents(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          toast.error(err instanceof Error ? err.message : "Failed to load events.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, filterFeatured, page, refreshKey]);

  // Manage object URL lifetime for the picked thumbnail preview.
  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailFileUrl(null);
      return;
    }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const handleThumbnailChosen = (file: File | null) => {
    if (!file) {
      setThumbnailFile(null);
      return;
    }
    const okType = /^image\/(jpeg|png)$/i.test(file.type);
    const okExt = /\.(jpe?g|png)$/i.test(file.name);
    if (!okType && !okExt) {
      toast.error("Thumbnail must be a .jpg or .png image");
      return;
    }
    setThumbnailFile(file);
  };

  const openEnrollments = (event: AppEvent) => {
    setEnrollmentsEvent(event);
    setEnrollments([]);
    setEnrollmentsTotal(0);
    setEnrollmentsPage(1);
    setEnrollmentsSearch("");
    setEnrollmentsDebouncedSearch("");
  };

  const openCreate = () => {
    setDialogMode("create");
    setEditingId(null);
    setForm(emptyForm());
    setThumbnailFile(null);
    setDialogOpen(true);
  };

  const openEdit = (event: AppEvent) => {
    setDialogMode("edit");
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      date: toDatetimeLocal(event.date),
      duration: event.duration,
      location: event.location,
      capacity: event.capacity,
      price: parseFloat(event.price),
      thumbnail: event.thumbnail ?? "",
      featured: event.featured,
    });
    setThumbnailFile(null);
    setDialogOpen(true);
  };

  const uploadThumbnailFor = async (eventId: string, file: File): Promise<string> => {
    const presign = await requestEventThumbnailPresign(role, eventId, {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const basePayload: CreateEventInput = {
        ...form,
        date: new Date(form.date).toISOString(),
        thumbnail: form.thumbnail?.trim() || undefined,
      };

      if (dialogMode === "create") {
        // Create first to obtain the event ID, then upload thumbnail (S3 key requires the ID).
        const created = await createEvent(role, {
          ...basePayload,
          thumbnail: thumbnailFile ? undefined : basePayload.thumbnail,
        });
        if (thumbnailFile) {
          const thumbnail = await uploadThumbnailFor(created.id, thumbnailFile);
          await updateEvent(role, created.id, { thumbnail });
        }
        toast.success("Event created");
      } else if (editingId) {
        let thumbnail = basePayload.thumbnail;
        if (thumbnailFile) {
          thumbnail = await uploadThumbnailFor(editingId, thumbnailFile);
        }
        await updateEvent(role, editingId, { ...basePayload, thumbnail });
        toast.success("Event updated");
      }
      setDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (event: AppEvent) => {
    if (!confirm(`Delete event "${event.title}"? This cannot be undone.`)) return;
    try {
      await deleteEvent(role, event.id);
      toast.success("Event deleted");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete event.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const upcomingCount = events.filter((e) => new Date(e.date) > new Date()).length;
  const featuredCount = events.filter((e) => e.featured).length;
  const totalCapacity = events.reduce((acc, e) => acc + e.capacity, 0);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#610981] to-[#8b0fa8] flex items-center justify-center shadow-md shadow-[#ffac96]/40">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            Create and manage workshops, retreats, and special events
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#610981] hover:bg-[#4a0663] text-white shadow-md shadow-[#ffac96]/30 shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Events",
            value: total,
            icon: Calendar,
            color: "text-[#610981]",
            bg: "bg-[#610981]/8",
          },
          {
            label: "Upcoming",
            value: upcomingCount,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Featured",
            value: featuredCount,
            icon: Star,
            color: "text-[#ff691d]",
            bg: "bg-[#ff691d]/8",
          },
          {
            label: "Total Capacity",
            value: totalCapacity,
            icon: Users,
            color: "text-sky-600",
            bg: "bg-sky-50",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filters ── */}
      <Card className="border-border/60">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 z-10 pointer-events-none" />
              <Input
                placeholder="Search by title or location..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(["", "true", "false"] as const).map((val) => (
                <Button
                  key={val}
                  variant={filterFeatured === val ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFilterFeatured(val);
                    setPage(1);
                  }}
                  className={
                    filterFeatured === val
                      ? "bg-[#610981] hover:bg-[#4a0663] text-white"
                      : ""
                  }
                >
                  {val === "" ? "All" : val === "true" ? "⭐ Featured" : "Regular"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <span>All Events</span>
            <Badge variant="secondary" className="font-normal text-xs">
              {total} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-border/60 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-4">Event</TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Date
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Location
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Duration
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Capacity
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5" /> Price
                    </span>
                  </TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-[#610981]/30 border-t-[#610981] rounded-full animate-spin" />
                        <span className="text-sm">Loading events...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#610981]/8 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-[#610981]/50" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">No events found</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Create your first event to get started
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={openCreate}
                          className="bg-[#610981] hover:bg-[#4a0663] text-white mt-1"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          Add Event
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => {
                    const isPast = new Date(event.date) < new Date();
                    const occupancyPct =
                      event.capacity > 0
                        ? Math.min(100, Math.round((event.occupancy / event.capacity) * 100))
                        : 0;
                    return (
                      <TableRow
                        key={event.id}
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => setViewEvent(event)}
                      >
                        <TableCell className="pl-4">
                          <div className="flex items-start gap-2.5 min-w-0">
                            {event.thumbnail ? (
                              <img
                                src={resolveMediaUrl(event.thumbnail)}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border/60"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-[#610981]/15 to-[#ff691d]/10 flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-[#610981]/60" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-sm truncate max-w-[180px]">
                                  {event.title}
                                </span>
                                {event.featured && (
                                  <Badge className="bg-[#ff691d]/10 text-[#ff691d] border-[#ff691d]/20 text-[10px] px-1.5 py-0 h-4">
                                    <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
                                    Featured
                                  </Badge>
                                )}
                                {isPast && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 h-4 bg-muted/60"
                                  >
                                    Past
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
                                {event.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{formatDate(event.date)}</div>
                            <div className="text-xs text-muted-foreground">{formatTime(event.date)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm max-w-[140px]">
                            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>{event.duration}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-[100px]">
                            <div className="flex justify-between text-xs mb-1">
                              <span className={`font-medium ${capacityColor(event.occupancy, event.capacity)}`}>
                                {capacityLabel(event.occupancy, event.capacity)}
                              </span>
                              <span className="text-muted-foreground">
                                {event.occupancy}/{event.capacity}
                              </span>
                            </div>
                            <Progress
                              value={occupancyPct}
                              className="h-1.5"
                              style={
                                {
                                  "--progress-color":
                                    occupancyPct >= 100
                                      ? "#dc2626"
                                      : occupancyPct >= 80
                                      ? "#f97316"
                                      : "#10b981",
                                } as React.CSSProperties
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5 text-sm font-medium">
                            <IndianRupee className="w-3 h-3" />
                            {parseFloat(event.price).toLocaleString("en-IN")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div
                            className="flex justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-sky-50 hover:text-sky-600"
                              title="View enrollments"
                              onClick={() => openEnrollments(event)}
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-[#610981]/8 hover:text-[#610981]"
                              onClick={() => openEdit(event)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDelete(event)}
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

          {total > LIMIT && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/60">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} &bull; {total} events
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
        </CardContent>
      </Card>

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !isSubmitting && setDialogOpen(o)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-linear-to-br from-[#610981] to-[#8b0fa8] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                {dialogMode === "create" ? "Create Event" : "Edit Event"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "create"
                  ? "Add a new workshop, retreat, or special event."
                  : "Update the event details below."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-1.5">
                <Label htmlFor="ev-title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ev-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Morning Vinyasa Intensive"
                  required
                  maxLength={60}
                  autoFocus
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="ev-description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="ev-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the event..."
                  required
                  maxLength={300}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="ev-date">
                    Date & Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ev-date"
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ev-duration">
                    Duration <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ev-duration"
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    placeholder="e.g. 2 hours"
                    required
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="ev-location">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ev-location"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Main Hall, Rishikesh"
                  required
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="ev-capacity">
                    Capacity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ev-capacity"
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, capacity: Math.max(1, parseInt(e.target.value) || 1) }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ev-price">
                    Price (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ev-price"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: Math.max(0, parseFloat(e.target.value) || 0) }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="ev-thumb-pick">
                  Thumbnail{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    · optional · .jpg or .png
                  </span>
                </Label>
                {(thumbnailFileUrl || form.thumbnail) && (
                  <div className="relative rounded-lg overflow-hidden bg-black/5 aspect-video max-h-48">
                    <img
                      src={thumbnailFileUrl ?? resolveMediaUrl(form.thumbnail)}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/30 transition-colors">
                  <input
                    id="ev-thumb-pick"
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className="hidden"
                    disabled={isSubmitting}
                    onChange={(e) => handleThumbnailChosen(e.target.files?.[0] ?? null)}
                  />
                  <label
                    htmlFor="ev-thumb-pick"
                    className="cursor-pointer flex flex-col items-center gap-1.5"
                  >
                    {thumbnailFile ? (
                      <>
                        <ImageIcon className="w-6 h-6 text-[#610981]" />
                        <p className="text-sm font-medium truncate max-w-full px-2">
                          {thumbnailFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Click to choose a different image
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {form.thumbnail
                            ? "Click to replace thumbnail"
                            : "Click to upload thumbnail (JPG or PNG)"}
                        </p>
                      </>
                    )}
                  </label>
                </div>
                {(thumbnailFile || form.thumbnail) && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={isSubmitting}
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

              <div className="flex items-center gap-2.5 pt-1">
                <Checkbox
                  id="ev-featured"
                  checked={form.featured}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, featured: Boolean(checked) }))
                  }
                  className="border-[#610981]/40 data-[state=checked]:bg-[#ff691d] data-[state=checked]:border-[#ff691d]"
                />
                <Label htmlFor="ev-featured" className="cursor-pointer select-none flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-[#ff691d]" />
                  Mark as Featured
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.title.trim() || !form.description.trim() || !form.date || !form.duration.trim() || !form.location.trim()}
                className="bg-[#610981] hover:bg-[#4a0663] text-white"
              >
                {isSubmitting
                  ? dialogMode === "create"
                    ? "Creating..."
                    : "Saving..."
                  : dialogMode === "create"
                  ? "Create Event"
                  : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── View Details Dialog ── */}
      <Dialog open={!!viewEvent} onOpenChange={(o) => !o && setViewEvent(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {viewEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 pr-6">
                  {viewEvent.featured && (
                    <Star className="w-4 h-4 text-[#ff691d] fill-current shrink-0" />
                  )}
                  <span className="truncate">{viewEvent.title}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {viewEvent.thumbnail && (
                  <img
                    src={resolveMediaUrl(viewEvent.thumbnail)}
                    alt={viewEvent.title}
                    className="w-full h-44 object-cover rounded-lg border border-border/60"
                  />
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {viewEvent.description}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      icon: Calendar,
                      label: "Date",
                      value: `${formatDate(viewEvent.date)} at ${formatTime(viewEvent.date)}`,
                    },
                    { icon: Clock, label: "Duration", value: viewEvent.duration },
                    { icon: MapPin, label: "Location", value: viewEvent.location },
                    {
                      icon: IndianRupee,
                      label: "Price",
                      value: `₹${parseFloat(viewEvent.price).toLocaleString("en-IN")}`,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start gap-2 p-3 rounded-lg bg-muted/40"
                    >
                      <item.icon className="w-4 h-4 text-[#610981] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          {item.label}
                        </p>
                        <p className="text-sm font-medium">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-muted/40">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#610981]" /> Registrations
                    </span>
                    <span
                      className={`font-bold ${capacityColor(viewEvent.occupancy, viewEvent.capacity)}`}
                    >
                      {viewEvent.occupancy} / {viewEvent.capacity}
                    </span>
                  </div>
                  <Progress
                    value={
                      viewEvent.capacity > 0
                        ? Math.min(100, (viewEvent.occupancy / viewEvent.capacity) * 100)
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewEvent(null)}>
                  Close
                </Button>
                <Button
                  className="bg-[#610981] hover:bg-[#4a0663] text-white"
                  onClick={() => {
                    setViewEvent(null);
                    openEdit(viewEvent);
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Enrollments Dialog ── */}
      <Dialog
        open={!!enrollmentsEvent}
        onOpenChange={(o) => {
          if (!o) {
            setEnrollmentsEvent(null);
            setEnrollments([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-sky-100 flex items-center justify-center">
                <ClipboardList className="w-3.5 h-3.5 text-sky-600" />
              </div>
              Enrollments
            </DialogTitle>
            <DialogDescription className="truncate">
              {enrollmentsEvent?.title} &bull;{" "}
              <span className="font-medium text-foreground">{enrollmentsTotal}</span> enrolled
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 z-10 pointer-events-none" />
            <Input
              placeholder="Search by name, email or phone..."
              value={enrollmentsSearch}
              onChange={(e) => {
                setEnrollmentsSearch(e.target.value);
                setEnrollmentsPage(1);
              }}
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg mt-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-4">Student</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="pr-4 text-right">Enrolled On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollmentsLoading && enrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-sky-300 border-t-sky-600 rounded-full animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : enrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {enrollmentsSearch ? "No students match your search." : "No enrollments yet."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  enrollments.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/20">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#610981]/15 to-[#ff691d]/10 flex items-center justify-center shrink-0 text-[#610981] font-semibold text-xs">
                            {row.student.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-sm font-medium">{row.student.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex flex-col leading-tight">
                          <span>{row.student.email}</span>
                          <span className="text-xs">{row.student.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                        {new Date(row.enrolledAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {enrollmentsTotal > 20 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Page {enrollmentsPage} of {Math.ceil(enrollmentsTotal / 20)} &bull; {enrollmentsTotal} total
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={enrollmentsPage === 1}
                  onClick={() => setEnrollmentsPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={enrollmentsPage >= Math.ceil(enrollmentsTotal / 20)}
                  onClick={() => setEnrollmentsPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
