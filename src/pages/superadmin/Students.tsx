import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Plus, Search, Edit, Trash2, Mail, Phone, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  listStudentEnrollments,
  updateStudentEnrollment,
  type StudentEnrollments,
  type EnrollmentType,
  type EnrollmentStatus,
} from "../../api/students";
import { listBatches } from "../../api/batches";
import type { Student, Batch } from "../../api/types";

type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

type StudentsAdminRole = "SUPERADMIN" | "OPERATIONS";

export function Students({ role = "SUPERADMIN" }: { role?: StudentsAdminRole } = {}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    age: "",
    city: "",
    country: "",
    referredByCode: "",
  });

  const [editing, setEditing] = useState<Student | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Subscriptions (enrollments) dialog
  const [subStudent, setSubStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollments | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listStudents(role, {
      q: debouncedQuery || undefined,
      page,
      limit: 20,
    })
      .then((res) => {
        if (cancelled) return;
        setStudents(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load students.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, page, refreshKey, role]);

  const visibleStudents = students.filter((s) =>
    activeFilter === "ALL" ? true : activeFilter === "ACTIVE" ? s.isActive : !s.isActive,
  );

  const refetch = () => setRefreshKey((k) => k + 1);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isAdding) return;
    setIsAdding(true);
    try {
      await createStudent(role, {
        name: addForm.name,
        email: addForm.email,
        phone: addForm.phone,
        password: addForm.password,
        age: addForm.age ? Number(addForm.age) : undefined,
        city: addForm.city || undefined,
        country: addForm.country || undefined,
        referredByCode: addForm.referredByCode || undefined,
      });
      toast.success("Sādhaka added successfully");
      setIsAddOpen(false);
      setAddForm({ name: "", email: "", phone: "", password: "", age: "", city: "", country: "", referredByCode: "" });
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add sādhaka.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || isUpdating) return;
    setIsUpdating(true);
    const fd = new FormData(event.currentTarget);
    try {
      await updateStudent(role, editing.id, {
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        isActive: fd.get("isActive") === "true",
      });
      toast.success("Sādhaka updated successfully");
      setEditing(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update sādhaka.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`Remove ${student.name}? Consider PATCH→INACTIVE to preserve history.`)) return;
    try {
      await deleteStudent(role, student.id);
      toast.success("Sādhaka deleted successfully");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete sādhaka.");
    }
  };

  const openSubscriptions = async (student: Student) => {
    setSubStudent(student);
    setEnrollments(null);
    setIsLoadingSubs(true);
    try {
      const [subs, batchPage] = await Promise.all([
        listStudentEnrollments(role, student.id),
        batches.length ? Promise.resolve(null) : listBatches(role, { limit: 100 }),
      ]);
      setEnrollments(subs);
      if (batchPage) setBatches(batchPage.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load subscriptions.");
    } finally {
      setIsLoadingSubs(false);
    }
  };

  const handleEnrollmentUpdate = async (
    type: EnrollmentType,
    enrollmentId: string,
    body: { endDate?: string; batchId?: string; status?: EnrollmentStatus },
  ) => {
    if (!subStudent) return;
    setSavingId(enrollmentId);
    try {
      await updateStudentEnrollment(role, subStudent.id, type, enrollmentId, body);
      toast.success("Subscription updated");
      const subs = await listStudentEnrollments(role, subStudent.id);
      setEnrollments(subs);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update subscription.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Sādhakas</h1>
          <p className="text-muted-foreground mt-1">Manage your yoga center Sādhakas</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />Add Sādhaka
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Add New Sādhaka</DialogTitle>
                <DialogDescription>Enter the details of the new sādhaka</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required maxLength={100} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="\d{10}"
                    title="Phone must be exactly 10 digits"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    required
                    minLength={10}
                    maxLength={10}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} required minLength={8} maxLength={128} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" min={1} max={120} value={addForm.age} onChange={(e) => setAddForm({ ...addForm, age: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="referredByCode">Referral Code (optional)</Label>
                  <Input id="referredByCode" value={addForm.referredByCode} onChange={(e) => setAddForm({ ...addForm, referredByCode: e.target.value })} maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={addForm.city} onChange={(e) => setAddForm({ ...addForm, city: e.target.value })} maxLength={100} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={addForm.country} onChange={(e) => setAddForm({ ...addForm, country: e.target.value })} maxLength={100} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isAdding}>{isAdding ? "Adding..." : "Add Sādhaka"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Total Sādhakas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active (page)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-green-500">{students.filter((s) => s.isActive).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Inactive (page)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-muted-foreground">{students.filter((s) => !s.isActive).length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>All Sādhakas</CardTitle>
            <CardDescription>View and manage sādhaka information</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 z-10 pointer-events-none" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as ActiveFilter)}>
              <SelectTrigger className="md:w-48 h-9 rounded-xl bg-input-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="INACTIVE">INACTIVE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && visibleStudents.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : visibleStudents.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No sādhakas found.</TableCell></TableRow>
                ) : (
                  visibleStudents.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="text-muted-foreground text-sm">#{(page - 1) * 20 + index + 1}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm"><Mail className="w-3 h-3 text-muted-foreground" />{student.email}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-3 h-3" />{student.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(student.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={student.isActive ? "default" : "secondary"}>{student.isActive ? "ACTIVE" : "INACTIVE"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" title="Subscriptions" onClick={() => openSubscriptions(student)}><CalendarClock className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => setEditing(student)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(student)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {total > 20 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 20)} • {total} total</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl">
          {editing && (
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Sādhaka</DialogTitle>
                <DialogDescription>Update sādhaka information</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input id="edit-name" name="name" defaultValue={editing.name} required maxLength={100} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={editing.email} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="\d{10}"
                    title="Phone must be exactly 10 digits"
                    defaultValue={editing.phone}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.value = el.value.replace(/\D/g, "").slice(0, 10);
                    }}
                    required
                    minLength={10}
                    maxLength={10}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="isActive" defaultValue={editing.isActive ? "true" : "false"}>
                    <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">ACTIVE</SelectItem>
                      <SelectItem value="false">INACTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" disabled={isUpdating}>{isUpdating ? "Saving..." : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!subStudent} onOpenChange={(open) => { if (!open) { setSubStudent(null); setEnrollments(null); } }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscriptions</DialogTitle>
            <DialogDescription>
              {subStudent ? `View and manage ${subStudent.name}'s active and past subscriptions` : ""}
            </DialogDescription>
          </DialogHeader>

          {isLoadingSubs ? (
            <div className="py-10 text-center text-muted-foreground">Loading subscriptions…</div>
          ) : !enrollments ? null : (
            <div className="space-y-6 py-2">
              <EnrollmentGroup
                title="Live"
                rows={enrollments.live}
                type="live"
                batches={batches}
                savingId={savingId}
                onUpdate={handleEnrollmentUpdate}
              />
              <EnrollmentGroup
                title="Self-paced"
                rows={enrollments.selfPaced}
                type="self-paced"
                savingId={savingId}
                onUpdate={handleEnrollmentUpdate}
              />
              <EnrollmentGroup
                title="YTT Live"
                rows={enrollments.yttLive}
                type="ytt-live"
                savingId={savingId}
                onUpdate={handleEnrollmentUpdate}
              />
              <EnrollmentGroup
                title="YTT Recorded"
                rows={enrollments.yttRecorded}
                type="ytt-recorded"
                savingId={savingId}
                onUpdate={handleEnrollmentUpdate}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setSubStudent(null); setEnrollments(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type EnrollmentRowLike = {
  id: string;
  startDate: string;
  endDate: string;
  status: EnrollmentStatus;
  plan: { id: string; name: string } | null;
  batchId?: string;
  batch?: { id: string; name: string } | null;
  course?: { id: string; title: string } | null;
};

function EnrollmentGroup({
  title,
  rows,
  type,
  batches,
  savingId,
  onUpdate,
}: {
  title: string;
  rows: EnrollmentRowLike[];
  type: EnrollmentType;
  batches?: Batch[];
  savingId: string | null;
  onUpdate: (
    type: EnrollmentType,
    enrollmentId: string,
    body: { endDate?: string; batchId?: string; status?: EnrollmentStatus },
  ) => void;
}) {
  return (
    <div>
      <h3 className="font-medium mb-2">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {title.toLowerCase()} subscriptions.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <EnrollmentRow
              key={row.id}
              row={row}
              type={type}
              batches={batches}
              saving={savingId === row.id}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EnrollmentRow({
  row,
  type,
  batches,
  saving,
  onUpdate,
}: {
  row: EnrollmentRowLike;
  type: EnrollmentType;
  batches?: Batch[];
  saving: boolean;
  onUpdate: (
    type: EnrollmentType,
    enrollmentId: string,
    body: { endDate?: string; batchId?: string; status?: EnrollmentStatus },
  ) => void;
}) {
  // <input type="date"> wants yyyy-MM-dd; the API returns ISO timestamps.
  const toDateInput = (iso: string) => iso.slice(0, 10);
  const [endDate, setEndDate] = useState(toDateInput(row.endDate));
  const [batchId, setBatchId] = useState(row.batchId ?? "");

  // Keep local edits in sync when the parent reloads after a save.
  useEffect(() => {
    setEndDate(toDateInput(row.endDate));
    setBatchId(row.batchId ?? "");
  }, [row.endDate, row.batchId]);

  const isLive = type === "live";
  const endChanged = endDate !== toDateInput(row.endDate);
  const batchChanged = isLive && batchId !== (row.batchId ?? "");
  const dirty = endChanged || batchChanged;

  const expired = new Date(row.endDate).getTime() < Date.now();

  const save = () => {
    const body: { endDate?: string; batchId?: string } = {};
    if (endChanged) body.endDate = new Date(`${endDate}T23:59:59`).toISOString();
    if (batchChanged) body.batchId = batchId;
    onUpdate(type, row.id, body);
  };

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <div className="font-medium">{row.plan?.name ?? "-"}</div>
          {row.course && <div className="text-xs text-muted-foreground">{row.course.title}</div>}
        </div>
        <Badge variant={row.status === "ACTIVE" && !expired ? "default" : "secondary"}>
          {row.status === "ACTIVE" && expired ? "EXPIRED" : row.status}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-xs">Start date</Label>
          <Input type="date" value={toDateInput(row.startDate)} disabled />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Ending date</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        {isLive && (
          <div className="grid gap-1.5 sm:col-span-2">
            <Label className="text-xs">Batch</Label>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {(batches ?? []).map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <Button size="sm" disabled={!dirty || saving} onClick={save}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
