import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import { Plus, Search, Edit, Trash2, Mail, Phone, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import {
  listOperations,
  createOperations,
  updateOperations,
  deleteOperations,
} from "../../api/operations";
import {
  listFrontline,
  createFrontline,
  updateFrontline,
  deleteFrontline,
} from "../../api/frontline";
import type { OperationsStaffRow, FrontlineAgentRow, StaffStatus } from "../../api/types";

const STATUSES: StaffStatus[] = ["ACTIVE", "ON_LEAVE", "TERMINATED"];

function statusVariant(status: StaffStatus): "default" | "secondary" | "outline" {
  if (status === "ACTIVE") return "default";
  if (status === "ON_LEAVE") return "secondary";
  return "outline";
}

function toDateInput(value: string): string {
  return value ? value.slice(0, 10) : "";
}

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────────────────
// OPERATIONS TAB
// ─────────────────────────────────────────────────────────────────────────

const EMPTY_OPS_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  department: "Operations",
  salary: "",
  joinDate: new Date().toISOString().slice(0, 10),
  workingHours: "",
  timezone: "Asia/Kolkata",
};

function OperationsTab() {
  const [rows, setRows] = useState<OperationsStaffRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StaffStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_OPS_FORM);

  const [editing, setEditing] = useState<OperationsStaffRow | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listOperations("SUPERADMIN", {
      q: debouncedQuery || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      limit: PAGE_SIZE,
    })
      .then((res) => {
        if (cancelled) return;
        setRows(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load operations staff.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, statusFilter, page, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isAdding) return;
    if (!/^\d{10}$/.test(addForm.phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    const salaryNum = Number(addForm.salary);
    if (!Number.isFinite(salaryNum) || salaryNum < 0) {
      toast.error("Salary must be a non-negative number.");
      return;
    }
    setIsAdding(true);
    try {
      await createOperations("SUPERADMIN", {
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        password: addForm.password,
        department: addForm.department,
        salary: salaryNum,
        joinDate: addForm.joinDate,
        ...(addForm.workingHours ? { workingHours: addForm.workingHours } : {}),
        ...(addForm.timezone ? { timezone: addForm.timezone } : {}),
      });
      toast.success("Operations staff added");
      setIsAddOpen(false);
      setAddForm(EMPTY_OPS_FORM);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add operations staff.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || isUpdating) return;
    const fd = new FormData(event.currentTarget);
    const phone = String(fd.get("phone") || "");
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    setIsUpdating(true);
    try {
      await updateOperations("SUPERADMIN", editing.id, {
        firstName: String(fd.get("firstName") || ""),
        lastName: String(fd.get("lastName") || ""),
        email: String(fd.get("email") || ""),
        phone,
        department: String(fd.get("department") || ""),
        salary: Number(fd.get("salary") || 0),
        joinDate: String(fd.get("joinDate") || ""),
        workingHours: String(fd.get("workingHours") || "") || null,
        timezone: String(fd.get("timezone") || "") || null,
        status: fd.get("status") as StaffStatus,
      });
      toast.success("Operations staff updated");
      setEditing(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update operations staff.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (row: OperationsStaffRow) => {
    if (!confirm(`Remove ${row.firstName} ${row.lastName}? Consider setting status to Terminated instead to preserve history.`)) return;
    try {
      await deleteOperations("SUPERADMIN", row.id);
      toast.success("Operations staff removed");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove operations staff.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Operations Staff</CardTitle>
          <CardDescription className="mt-1">Login accounts for the Operations panel — created and managed by SuperAdmin</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) setAddForm(EMPTY_OPS_FORM); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Operations Staff</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Add Operations Staff</DialogTitle>
                <DialogDescription>Employee ID is auto-assigned (OPS-YEAR-###). This account can log in to the Operations panel.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="ops-firstName">First Name</Label>
                  <Input id="ops-firstName" value={addForm.firstName} onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })} required maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ops-lastName">Last Name</Label>
                  <Input id="ops-lastName" value={addForm.lastName} onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })} required maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ops-email">Email</Label>
                  <Input id="ops-email" type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ops-phone">Phone</Label>
                  <Input id="ops-phone" type="tel" inputMode="numeric" pattern="\d{10}" maxLength={10} value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} required title="Enter a 10-digit phone number" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ops-password">Initial Password</Label>
                  <Input id="ops-password" type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} required minLength={8} placeholder="Min 8 characters" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ops-department">Department</Label>
                  <Input id="ops-department" value={addForm.department} onChange={(e) => setAddForm({ ...addForm, department: e.target.value })} maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ops-salary">Salary (₹)</Label>
                  <Input id="ops-salary" type="number" min={0} value={addForm.salary} onChange={(e) => setAddForm({ ...addForm, salary: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ops-joinDate">Join Date</Label>
                  <Input id="ops-joinDate" type="date" value={addForm.joinDate} onChange={(e) => setAddForm({ ...addForm, joinDate: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ops-workingHours">Working Hours</Label>
                  <Input id="ops-workingHours" value={addForm.workingHours} onChange={(e) => setAddForm({ ...addForm, workingHours: e.target.value })} placeholder="e.g., 9 AM - 6 PM" maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ops-timezone">Timezone</Label>
                  <Input id="ops-timezone" value={addForm.timezone} onChange={(e) => setAddForm({ ...addForm, timezone: e.target.value })} maxLength={50} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isAdding}>{isAdding ? "Adding..." : "Add Operations Staff"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 z-10 pointer-events-none" />
          <Input placeholder="Search by name, email, or employee ID..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StaffStatus | "ALL"); setPage(1); }}>
          <SelectTrigger className="md:w-48 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No operations staff found.</TableCell></TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.employeeId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-semibold">
                        {row.firstName.charAt(0)}
                      </div>
                      {row.firstName} {row.lastName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm"><Mail className="w-3 h-3 text-muted-foreground" />{row.email}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-3 h-3" />{row.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{row.department}</TableCell>
                  <TableCell>{new Date(row.joinDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="font-semibold flex items-center gap-1"><IndianRupee className="w-3 h-3" />{Number(row.salary).toLocaleString()}</div>
                  </TableCell>
                  <TableCell><Badge variant={statusVariant(row.status)}>{row.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(row)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(row)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / PAGE_SIZE)} • {total} total</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl">
          {editing && (
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Operations Staff</DialogTitle>
                <DialogDescription>Update account details. Employee ID and password cannot be changed here.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="eops-firstName">First Name</Label>
                  <Input id="eops-firstName" name="firstName" defaultValue={editing.firstName} required maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eops-lastName">Last Name</Label>
                  <Input id="eops-lastName" name="lastName" defaultValue={editing.lastName} required maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eops-email">Email</Label>
                  <Input id="eops-email" name="email" type="email" defaultValue={editing.email} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eops-phone">Phone</Label>
                  <Input id="eops-phone" name="phone" type="tel" inputMode="numeric" pattern="\d{10}" maxLength={10} defaultValue={editing.phone} onChange={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 10); }} required title="Enter a 10-digit phone number" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eops-department">Department</Label>
                  <Input id="eops-department" name="department" defaultValue={editing.department} maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eops-salary">Salary (₹)</Label>
                  <Input id="eops-salary" name="salary" type="number" min={0} defaultValue={String(editing.salary)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eops-joinDate">Join Date</Label>
                  <Input id="eops-joinDate" name="joinDate" type="date" defaultValue={toDateInput(editing.joinDate)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eops-workingHours">Working Hours</Label>
                  <Input id="eops-workingHours" name="workingHours" defaultValue={editing.workingHours ?? ""} maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eops-timezone">Timezone</Label>
                  <Input id="eops-timezone" name="timezone" defaultValue={editing.timezone ?? ""} maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eops-status">Status</Label>
                  <Select name="status" defaultValue={editing.status}>
                    <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FRONTLINE TAB
// ─────────────────────────────────────────────────────────────────────────

const EMPTY_FL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  designation: "Lead Generation Specialist",
  department: "Lead Generation",
  dailyTarget: "50",
  salary: "",
  joinDate: new Date().toISOString().slice(0, 10),
};

function FrontlineTab() {
  const [rows, setRows] = useState<FrontlineAgentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StaffStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FL_FORM);

  const [editing, setEditing] = useState<FrontlineAgentRow | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listFrontline("SUPERADMIN", {
      q: debouncedQuery || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      limit: PAGE_SIZE,
    })
      .then((res) => {
        if (cancelled) return;
        setRows(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load frontline staff.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, statusFilter, page, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isAdding) return;
    if (!/^\d{10}$/.test(addForm.phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    const salaryNum = Number(addForm.salary);
    if (!Number.isFinite(salaryNum) || salaryNum < 0) {
      toast.error("Salary must be a non-negative number.");
      return;
    }
    setIsAdding(true);
    try {
      await createFrontline("SUPERADMIN", {
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        password: addForm.password,
        designation: addForm.designation,
        department: addForm.department,
        dailyTarget: Number(addForm.dailyTarget) || 0,
        salary: salaryNum,
        joinDate: addForm.joinDate,
      });
      toast.success("Frontline staff added");
      setIsAddOpen(false);
      setAddForm(EMPTY_FL_FORM);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add frontline staff.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || isUpdating) return;
    const fd = new FormData(event.currentTarget);
    const phone = String(fd.get("phone") || "");
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    setIsUpdating(true);
    try {
      await updateFrontline("SUPERADMIN", editing.id, {
        firstName: String(fd.get("firstName") || ""),
        lastName: String(fd.get("lastName") || ""),
        email: String(fd.get("email") || ""),
        phone,
        designation: String(fd.get("designation") || ""),
        department: String(fd.get("department") || ""),
        dailyTarget: Number(fd.get("dailyTarget") || 0),
        salary: Number(fd.get("salary") || 0),
        joinDate: String(fd.get("joinDate") || ""),
        status: fd.get("status") as StaffStatus,
      });
      toast.success("Frontline staff updated");
      setEditing(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update frontline staff.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (row: FrontlineAgentRow) => {
    if (!confirm(`Remove ${row.firstName} ${row.lastName}? Consider setting status to Terminated instead to preserve history.`)) return;
    try {
      await deleteFrontline("SUPERADMIN", row.id);
      toast.success("Frontline staff removed");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove frontline staff.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Frontline Staff</CardTitle>
          <CardDescription className="mt-1">Login accounts for the Frontline panel — lead generation & front desk</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) setAddForm(EMPTY_FL_FORM); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Frontline Staff</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Add Frontline Staff</DialogTitle>
                <DialogDescription>Employee ID is auto-assigned (FL-YEAR-###). This account can log in to the Frontline panel.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="fl-firstName">First Name</Label>
                  <Input id="fl-firstName" value={addForm.firstName} onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })} required maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fl-lastName">Last Name</Label>
                  <Input id="fl-lastName" value={addForm.lastName} onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })} required maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fl-email">Email</Label>
                  <Input id="fl-email" type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fl-phone">Phone</Label>
                  <Input id="fl-phone" type="tel" inputMode="numeric" pattern="\d{10}" maxLength={10} value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} required title="Enter a 10-digit phone number" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fl-password">Initial Password</Label>
                  <Input id="fl-password" type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} required minLength={8} placeholder="Min 8 characters" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fl-designation">Designation</Label>
                  <Input id="fl-designation" value={addForm.designation} onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })} maxLength={100} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fl-department">Department</Label>
                  <Input id="fl-department" value={addForm.department} onChange={(e) => setAddForm({ ...addForm, department: e.target.value })} maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fl-dailyTarget">Daily Target</Label>
                  <Input id="fl-dailyTarget" type="number" min={0} value={addForm.dailyTarget} onChange={(e) => setAddForm({ ...addForm, dailyTarget: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fl-salary">Salary (₹)</Label>
                  <Input id="fl-salary" type="number" min={0} value={addForm.salary} onChange={(e) => setAddForm({ ...addForm, salary: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fl-joinDate">Join Date</Label>
                  <Input id="fl-joinDate" type="date" value={addForm.joinDate} onChange={(e) => setAddForm({ ...addForm, joinDate: e.target.value })} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isAdding}>{isAdding ? "Adding..." : "Add Frontline Staff"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 z-10 pointer-events-none" />
          <Input placeholder="Search by name, email, or employee ID..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StaffStatus | "ALL"); setPage(1); }}>
          <SelectTrigger className="md:w-48 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Daily Target</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No frontline staff found.</TableCell></TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.employeeId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
                        {row.firstName.charAt(0)}
                      </div>
                      {row.firstName} {row.lastName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm"><Mail className="w-3 h-3 text-muted-foreground" />{row.email}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-3 h-3" />{row.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{row.designation}</TableCell>
                  <TableCell>{row.dailyTarget}</TableCell>
                  <TableCell>
                    <div className="font-semibold flex items-center gap-1"><IndianRupee className="w-3 h-3" />{Number(row.salary).toLocaleString()}</div>
                  </TableCell>
                  <TableCell><Badge variant={statusVariant(row.status)}>{row.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(row)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(row)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / PAGE_SIZE)} • {total} total</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl">
          {editing && (
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Frontline Staff</DialogTitle>
                <DialogDescription>Update account details. Employee ID and password cannot be changed here.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="efl-firstName">First Name</Label>
                  <Input id="efl-firstName" name="firstName" defaultValue={editing.firstName} required maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="efl-lastName">Last Name</Label>
                  <Input id="efl-lastName" name="lastName" defaultValue={editing.lastName} required maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="efl-email">Email</Label>
                  <Input id="efl-email" name="email" type="email" defaultValue={editing.email} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="efl-phone">Phone</Label>
                  <Input id="efl-phone" name="phone" type="tel" inputMode="numeric" pattern="\d{10}" maxLength={10} defaultValue={editing.phone} onChange={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 10); }} required title="Enter a 10-digit phone number" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="efl-designation">Designation</Label>
                  <Input id="efl-designation" name="designation" defaultValue={editing.designation} maxLength={100} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="efl-department">Department</Label>
                  <Input id="efl-department" name="department" defaultValue={editing.department} maxLength={50} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="efl-dailyTarget">Daily Target</Label>
                  <Input id="efl-dailyTarget" name="dailyTarget" type="number" min={0} defaultValue={String(editing.dailyTarget)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="efl-salary">Salary (₹)</Label>
                  <Input id="efl-salary" name="salary" type="number" min={0} defaultValue={String(editing.salary)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="efl-joinDate">Join Date</Label>
                  <Input id="efl-joinDate" name="joinDate" type="date" defaultValue={toDateInput(editing.joinDate)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="efl-status">Status</Label>
                  <Select name="status" defaultValue={editing.status}>
                    <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────

type EmployeeTab = "operations" | "frontline";

export function Employees() {
  const [tab, setTab] = useState<EmployeeTab>("operations");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Employees</h1>
        <p className="text-muted-foreground mt-1">Manage Operations and Frontline staff accounts</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as EmployeeTab)}>
        <TabsList className="grid w-full max-w-xl grid-cols-2 h-12 bg-muted/30 p-1.5 gap-1 rounded-xl border border-border/40">
          <TabsTrigger
            value="operations"
            className="h-full rounded-lg gap-2 text-gray-400 bg-transparent border-0 transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#610981] data-[state=active]:font-semibold"
          >
            Operations
          </TabsTrigger>
          <TabsTrigger
            value="frontline"
            className="h-full rounded-lg gap-2 text-gray-400 bg-transparent border-0 transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#610981] data-[state=active]:font-semibold"
          >
            Frontline
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          {tab === "operations" ? <OperationsTab /> : <FrontlineTab />}
        </CardContent>
      </Card>
    </div>
  );
}
