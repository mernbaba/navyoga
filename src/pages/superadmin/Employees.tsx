import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Plus, Search, Edit, Trash2, Mail, Phone, Briefcase, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { listEmployees, createEmployee, updateEmployee, deleteEmployee } from "../../api/employees";
import type { Employee, StaffStatus } from "../../api/types";

const STATUSES: StaffStatus[] = ["ACTIVE", "ON_LEAVE", "TERMINATED"];

function statusVariant(status: StaffStatus): "default" | "secondary" | "outline" {
  if (status === "ACTIVE") return "default";
  if (status === "ON_LEAVE") return "secondary";
  return "outline";
}

export function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StaffStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    salary: "",
    joinDate: new Date().toISOString().slice(0, 10),
  });

  const [editing, setEditing] = useState<Employee | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listEmployees("SUPERADMIN", {
      q: debouncedQuery || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      limit: 20,
    })
      .then((res) => {
        if (cancelled) return;
        setEmployees(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load employees.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, statusFilter, page, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const totalSalary = employees.filter((e) => e.status === "ACTIVE").reduce((sum, e) => sum + Number(e.salary || 0), 0);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isAdding) return;
    setIsAdding(true);
    try {
      await createEmployee("SUPERADMIN", {
        name: addForm.name,
        email: addForm.email,
        phone: addForm.phone,
        role: addForm.role,
        department: addForm.department,
        salary: Number(addForm.salary) || 0,
        joinDate: addForm.joinDate,
      });
      toast.success("Employee added successfully");
      setIsAddOpen(false);
      setAddForm({ name: "", email: "", phone: "", role: "", department: "", salary: "", joinDate: new Date().toISOString().slice(0, 10) });
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add employee.");
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
      await updateEmployee("SUPERADMIN", editing.id, {
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        role: String(fd.get("role") || ""),
        department: String(fd.get("department") || ""),
        salary: Number(fd.get("salary") || 0),
        status: fd.get("status") as StaffStatus,
      });
      toast.success("Employee updated successfully");
      setEditing(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update employee.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Remove ${employee.name}? Consider PATCH→TERMINATED instead to preserve history.`)) return;
    try {
      await deleteEmployee("SUPERADMIN", employee.id);
      toast.success("Employee removed");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove employee.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage your yoga center staff</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>Enter the details of the new employee</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role / Job Title</Label>
                  <Input id="role" value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })} placeholder="Accountant, Receptionist, etc." required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" value={addForm.department} onChange={(e) => setAddForm({ ...addForm, department: e.target.value })} placeholder="e.g., Operations" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="joinDate">Join Date</Label>
                  <Input id="joinDate" type="date" value={addForm.joinDate} onChange={(e) => setAddForm({ ...addForm, joinDate: e.target.value })} required />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="salary">Salary (₹)</Label>
                  <Input id="salary" type="number" min={0} value={addForm.salary} onChange={(e) => setAddForm({ ...addForm, salary: e.target.value })} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isAdding}>{isAdding ? "Adding..." : "Add Employee"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Total Employees</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active (page)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-green-500">{employees.filter((e) => e.status === "ACTIVE").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>On Leave (page)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-yellow-500">{employees.filter((e) => e.status === "ON_LEAVE").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Page Payroll</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold flex items-center gap-1">
              <IndianRupee className="w-6 h-6" />{totalSalary.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>All Employees</CardTitle>
            <CardDescription>View and manage staff information</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 z-10 pointer-events-none" />
              <Input
                placeholder="Search by name, email, or employee ID..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StaffStatus | "ALL"); setPage(1); }}>
              <SelectTrigger className="md:w-48 h-9 rounded-xl bg-input-background/50">
                <SelectValue />
              </SelectTrigger>
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
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && employees.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : employees.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No employees found.</TableCell></TableRow>
                ) : (
                  employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.employeeId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
                            {employee.name.charAt(0)}
                          </div>
                          {employee.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm"><Mail className="w-3 h-3 text-muted-foreground" />{employee.email}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-3 h-3" />{employee.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          <Briefcase className="w-3 h-3 mr-1" />{employee.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{new Date(employee.joinDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="font-semibold flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />{Number(employee.salary).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={statusVariant(employee.status)}>{employee.status.replace("_", " ")}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditing(employee)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(employee)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
                <DialogTitle>Edit Employee</DialogTitle>
                <DialogDescription>Update employee information</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input id="edit-name" name="name" defaultValue={editing.name} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={editing.email} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" name="phone" defaultValue={editing.phone} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-role">Role / Job Title</Label>
                  <Input id="edit-role" name="role" defaultValue={editing.role} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Input id="edit-department" name="department" defaultValue={editing.department} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-salary">Monthly Salary (₹)</Label>
                  <Input id="edit-salary" name="salary" type="number" min={0} defaultValue={editing.salary} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={editing.status}>
                    <SelectTrigger className="h-9 w-full rounded-xl bg-input-background/50">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
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
