import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Plus, Search, Edit, Trash2, Mail, Phone, CalendarClock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { PHONE_PATTERN, PHONE_TITLE, PHONE_MIN_LENGTH, PHONE_MAX_LENGTH, sanitizePhone, handlePhoneInput } from "../../lib/phone";
import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  listStudentEnrollments,
  updateStudentEnrollment,
  grantStudentEnrollment,
  type StudentEnrollments,
  type EnrollmentType,
  type EnrollmentStatus,
} from "../../api/students";
import { listBatches } from "../../api/batches";
import {
  listLivePlans,
  listSelfPacedPlans,
  listYTTLiveCourses,
  listAllYTTLivePlans,
  listYTTRecordedCourses,
  listAllYTTRecordedPlans,
} from "../../api/plans";
import type { Student, Batch, YTTCourse } from "../../api/types";

type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

type StudentsAdminRole = "SUPERADMIN" | "OPERATIONS";

// A student counts as INACTIVE for filtering/stats purposes if their account
// is disabled OR their most recent Live subscription has lapsed — expired is
// treated as a subtype of inactive here, not a separate bucket. The Status
// column still labels expired rows distinctly (see isRowExpired below) since
// that's more informative for an admin at a glance.
function isStudentActive(student: Student): boolean {
  if (!student.isActive) return false;
  if (student.subscriptionEndDate && new Date(student.subscriptionEndDate).getTime() < Date.now()) {
    return false;
  }
  return true;
}

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
  const [showPassword, setShowPassword] = useState(false);

  const [editing, setEditing] = useState<Student | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Subscriptions (enrollments) dialog
  const [subStudent, setSubStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollments | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isGranting, setIsGranting] = useState(false);

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
    activeFilter === "ALL" ? true : activeFilter === "ACTIVE" ? isStudentActive(s) : !isStudentActive(s),
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

  const handleGrant = async (body: {
    type: EnrollmentType;
    planId: string;
    amount: number;
    batchId?: string;
    courseId?: string;
    method?: string;
    notes?: string;
  }) => {
    if (!subStudent) return;
    setIsGranting(true);
    try {
      await grantStudentEnrollment(role, subStudent.id, body);
      toast.success("Subscription granted");
      const subs = await listStudentEnrollments(role, subStudent.id);
      setEnrollments(subs);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to grant subscription.");
      throw error; // let the form keep its values open on failure
    } finally {
      setIsGranting(false);
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
                    pattern={PHONE_PATTERN}
                    title={PHONE_TITLE}
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: sanitizePhone(e.target.value) })}
                    required
                    minLength={PHONE_MIN_LENGTH}
                    maxLength={PHONE_MAX_LENGTH}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      className="pr-10"
                      required
                      minLength={8}
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
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
          <CardContent><div className="text-3xl font-semibold text-green-500">{students.filter(isStudentActive).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Expired (page)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-muted-foreground">{students.filter((s) => !isStudentActive(s)).length}</div></CardContent>
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
                <SelectItem value="INACTIVE">EXPIRED</SelectItem>
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
                  <TableHead>Batch</TableHead>
                  <TableHead>Live Yoga Subscription</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && visibleStudents.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : visibleStudents.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No sādhakas found.</TableCell></TableRow>
                ) : (
                  visibleStudents.map((student, index) => {
                    const subscriptionEnd = student.subscriptionEndDate ? new Date(student.subscriptionEndDate) : null;
                    const isExpired = !!subscriptionEnd && subscriptionEnd.getTime() < Date.now();
                    return (
                    <TableRow key={student.id}>
                      <TableCell className="text-muted-foreground text-sm">#{(page - 1) * 20 + index + 1}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm"><Mail className="w-3 h-3 text-muted-foreground" />{student.email}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-3 h-3" />{student.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.batches && student.batches.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {student.batches.map((b) => (
                              <Badge key={b.id} variant="outline">{b.name}</Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.subscriptionStartDate && student.subscriptionEndDate ? (
                          <span className={`text-sm ${isExpired ? "text-destructive" : ""}`}>
                            {new Date(student.subscriptionStartDate).toLocaleDateString()} &ndash; {new Date(student.subscriptionEndDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="destructive">EXPIRED</Badge>
                            <span className="text-xs text-muted-foreground">Ended {subscriptionEnd!.toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <Badge variant={student.isActive ? "default" : "destructive"}>{student.isActive ? "ACTIVE" : "EXPIRED"}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" title="Subscriptions" onClick={() => openSubscriptions(student)}><CalendarClock className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => setEditing(student)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(student)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
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
                    pattern={PHONE_PATTERN}
                    title={PHONE_TITLE}
                    defaultValue={editing.phone}
                    onInput={handlePhoneInput}
                    required
                    minLength={PHONE_MIN_LENGTH}
                    maxLength={PHONE_MAX_LENGTH}
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
                      <SelectItem value="false">EXPIRED</SelectItem>
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
              <GrantSubscriptionForm
                role={role}
                batches={batches}
                granting={isGranting}
                onGrant={handleGrant}
              />
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

// ─── Grant subscription (manual / cash / payment-failed) ─────────────────────
// Admin-only form to enable a subscription when the online payment failed but
// the student paid out-of-band, or for a cash purchase. Records a PAID payment
// so the amount reflects in the finance reports.

type GrantType = EnrollmentType;

type PlanOption = { id: string; name: string; price: number; courseId?: string };
type CourseOption = { id: string; title: string };

const GRANT_TYPE_LABEL: Record<GrantType, string> = {
  live: "Live",
  "self-paced": "Self-paced",
  "ytt-live": "YTT Live",
  "ytt-recorded": "YTT Recorded",
};

function GrantSubscriptionForm({
  role,
  batches,
  granting,
  onGrant,
}: {
  role: StudentsAdminRole;
  batches: Batch[];
  granting: boolean;
  onGrant: (body: {
    type: GrantType;
    planId: string;
    amount: number;
    batchId?: string;
    courseId?: string;
    method?: string;
    notes?: string;
  }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<GrantType>("live");

  // Plans/courses are loaded lazily per type on first use and cached here.
  const [plansByType, setPlansByType] = useState<Partial<Record<GrantType, PlanOption[]>>>({});
  const [coursesByType, setCoursesByType] = useState<Partial<Record<GrantType, CourseOption[]>>>({});
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [courseId, setCourseId] = useState("");
  const [planId, setPlanId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [amount, setAmount] = useState("");
  // Whether the admin has hand-edited the amount; once true we stop auto-filling.
  const [amountTouched, setAmountTouched] = useState(false);
  const [method, setMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  const isLive = type === "live";
  const isCourseType = type === "ytt-live" || type === "ytt-recorded";

  const plans = plansByType[type] ?? [];
  const courses = coursesByType[type] ?? [];
  // For course types, only show plans belonging to the selected course.
  const visiblePlans = isCourseType
    ? plans.filter((p) => p.courseId === courseId)
    : plans;

  const resetSelections = () => {
    setCourseId("");
    setPlanId("");
    setBatchId("");
    setAmount("");
    setAmountTouched(false);
    setNotes("");
  };

  // Load the option lists for a type the first time it's selected.
  const loadOptions = async (t: GrantType) => {
    if (plansByType[t]) return; // already cached
    setLoadingOptions(true);
    try {
      if (t === "live") {
        const list = await listLivePlans(role);
        setPlansByType((m) => ({ ...m, live: list.map((p) => ({ id: p.id, name: p.name, price: Number(p.price) })) }));
      } else if (t === "self-paced") {
        const list = await listSelfPacedPlans(role);
        setPlansByType((m) => ({ ...m, "self-paced": list.map((p) => ({ id: p.id, name: p.name, price: Number(p.price) })) }));
      } else if (t === "ytt-live") {
        const [courseList, planList] = await Promise.all([
          listYTTLiveCourses(role),
          listAllYTTLivePlans(role),
        ]);
        setCoursesByType((m) => ({ ...m, "ytt-live": (courseList as YTTCourse[]).map((c) => ({ id: c.id, title: c.title })) }));
        setPlansByType((m) => ({ ...m, "ytt-live": planList.map((p) => ({ id: p.id, name: p.name, price: Number(p.price), courseId: p.courseId })) }));
      } else if (t === "ytt-recorded") {
        const [courseList, planList] = await Promise.all([
          listYTTRecordedCourses(role),
          listAllYTTRecordedPlans(role),
        ]);
        setCoursesByType((m) => ({ ...m, "ytt-recorded": (courseList as YTTCourse[]).map((c) => ({ id: c.id, title: c.title })) }));
        setPlansByType((m) => ({ ...m, "ytt-recorded": planList.map((p) => ({ id: p.id, name: p.name, price: Number(p.price), courseId: p.courseId })) }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load plans.");
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) void loadOptions(type);
  };

  const handleTypeChange = (t: GrantType) => {
    setType(t);
    resetSelections();
    void loadOptions(t);
  };

  const handlePlanChange = (id: string) => {
    setPlanId(id);
    // Auto-fill the amount with the plan's price unless the admin already edited it.
    if (!amountTouched) {
      const p = (plansByType[type] ?? []).find((x) => x.id === id);
      if (p) setAmount(String(p.price));
    }
  };

  const canSubmit =
    !!planId &&
    amount !== "" &&
    Number(amount) >= 0 &&
    (!isLive || !!batchId) &&
    (!isCourseType || !!courseId);

  const submit = async () => {
    if (!canSubmit) return;
    try {
      await onGrant({
        type,
        planId,
        amount: Number(amount),
        ...(isLive ? { batchId } : {}),
        ...(isCourseType ? { courseId } : {}),
        method: method || undefined,
        notes: notes.trim() || undefined,
      });
      // Success — collapse and clear for the next grant.
      resetSelections();
      setOpen(false);
    } catch {
      // handleGrant already toasted; keep the form open with values intact.
    }
  };

  return (
    <div className="rounded-lg border border-dashed p-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Grant subscription</h3>
          <p className="text-xs text-muted-foreground">
            Manually enable a subscription (cash payment, or when an online payment failed).
          </p>
        </div>
        <Button variant={open ? "outline" : "default"} size="sm" onClick={handleOpen}>
          {open ? "Cancel" : <><Plus className="w-4 h-4 mr-1" />Grant</>}
        </Button>
      </div>

      {open && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={(v) => handleTypeChange(v as GrantType)}>
              <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(GRANT_TYPE_LABEL) as GrantType[]).map((t) => (
                  <SelectItem key={t} value={t}>{GRANT_TYPE_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCourseType && (
            <div className="grid gap-1.5">
              <Label className="text-xs">Course</Label>
              <Select
                value={courseId}
                onValueChange={(v) => { setCourseId(v); setPlanId(""); if (!amountTouched) setAmount(""); }}
                disabled={loadingOptions}
              >
                <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                  <SelectValue placeholder={loadingOptions ? "Loading…" : "Select course"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label className="text-xs">Plan</Label>
            <Select
              value={planId}
              onValueChange={handlePlanChange}
              disabled={loadingOptions || (isCourseType && !courseId)}
            >
              <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                <SelectValue placeholder={loadingOptions ? "Loading…" : isCourseType && !courseId ? "Pick a course first" : "Select plan"} />
              </SelectTrigger>
              <SelectContent>
                {visiblePlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} · ₹{p.price}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLive && (
            <div className="grid gap-1.5">
              <Label className="text-xs">Batch</Label>
              <Select value={batchId} onValueChange={setBatchId}>
                <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label className="text-xs">Amount collected (₹, incl. GST)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setAmountTouched(true); }}
              placeholder="0.00"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label className="text-xs">Note (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid cash at studio; Razorpay attempt failed on 12 Jul"
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <Button size="sm" disabled={!canSubmit || granting} onClick={submit}>
              {granting ? "Granting…" : "Grant subscription"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
