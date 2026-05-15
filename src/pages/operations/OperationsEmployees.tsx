import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Users, Plus, Search, Edit, Trash2, UserCog, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { listEmployees, createEmployee, updateEmployee, deleteEmployee } from "../../api/employees";
import type { Employee, StaffStatus } from "../../api/types";

const STATUSES: StaffStatus[] = ["ACTIVE", "ON_LEAVE", "TERMINATED"];
const DEPARTMENTS = ["Operations", "HR", "Finance", "Marketing", "IT"];

const EMPTY_ADD_FORM = {
  name: "",
  email: "",
  phone: "",
  department: "Operations",
  role: "",
  salary: "",
  joinDate: new Date().toISOString().slice(0, 10),
  status: "ACTIVE" as StaffStatus,
};

function toDateInput(value: string): string {
  return value ? value.slice(0, 10) : "";
}

export function OperationsEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StaffStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);

  const [editing, setEditing] = useState<Employee | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listEmployees("OPERATIONS", {
      q: debouncedTerm || undefined,
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
  }, [debouncedTerm, statusFilter, page, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;
  const onLeaveCount = employees.filter((e) => e.status === "ON_LEAVE").length;
  const terminatedCount = employees.filter((e) => e.status === "TERMINATED").length;

  const metrics = [
    { title: "Total Employees", value: String(total), icon: Users, color: "#ff691d" },
    { title: "Active (page)", value: String(activeCount), icon: UserCog, color: "#10b981" },
    { title: "On Leave (page)", value: String(onLeaveCount), icon: UserCog, color: "#f59e0b" },
    { title: "Terminated (page)", value: String(terminatedCount), icon: UserCog, color: "#ef4444" },
  ];

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isAdding) return;
    const salaryNum = Number(addForm.salary);
    if (!Number.isFinite(salaryNum) || salaryNum < 0) {
      toast.error("Salary must be a non-negative number");
      return;
    }
    if (!/^\d{10}$/.test(addForm.phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    setIsAdding(true);
    try {
      await createEmployee("OPERATIONS", {
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        department: addForm.department,
        role: addForm.role.trim(),
        salary: salaryNum,
        joinDate: addForm.joinDate,
        status: addForm.status,
      });
      toast.success("Employee added successfully");
      setIsAddOpen(false);
      setAddForm(EMPTY_ADD_FORM);
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
    const fd = new FormData(event.currentTarget);
    const salaryNum = Number(fd.get("salary") || 0);
    const phone = String(fd.get("phone") || "");
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    setIsUpdating(true);
    try {
      await updateEmployee("OPERATIONS", editing.id, {
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        phone,
        department: String(fd.get("department") || ""),
        role: String(fd.get("role") || ""),
        salary: salaryNum,
        joinDate: String(fd.get("joinDate") || ""),
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
    if (!confirm(`Delete ${employee.name}? This cannot be undone.`)) return;
    try {
      await deleteEmployee("OPERATIONS", employee.id);
      toast.success("Employee deleted successfully");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete employee.");
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: "#ff691d" }}>Employee Management</h1>
          <p className="text-muted-foreground mt-1">Manage all employees across departments</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{ backgroundColor: metric.color }} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${metric.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: metric.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{metric.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle style={{ color: "#ff691d" }}>All Employees</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 z-10 pointer-events-none" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StaffStatus | "ALL"); setPage(1); }}>
                  <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={() => setIsAddOpen(true)} className="gap-2" style={{ backgroundColor: "#610981" }}>
                  <Plus className="w-4 h-4" />Add Employee
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Employee ID</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Name</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Department</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Role</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Status</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && employees.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                  ) : employees.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No employees found.</td></tr>
                  ) : (
                    employees.map((employee) => (
                      <tr key={employee.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-sm">{employee.employeeId}</span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </td>
                        <td className="py-3 px-4">{employee.department}</td>
                        <td className="py-3 px-4">{employee.role}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs">{employee.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs">{employee.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={employee.status === "ACTIVE" ? "default" : "secondary"}>
                            {employee.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditing(employee)} className="hover:bg-blue-50">
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(employee)} className="hover:bg-red-50">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
      </div>

      <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) setAddForm(EMPTY_ADD_FORM); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: "#ff691d" }}>Add New Employee</DialogTitle>
            <DialogDescription>Employee ID is auto-assigned. Fill in the details to add a new employee.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" style={{ color: "#ffac96" }}>Full Name</Label>
                <Input id="name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="mt-1" required maxLength={100} />
              </div>
              <div>
                <Label htmlFor="email" style={{ color: "#ffac96" }}>Email</Label>
                <Input id="email" type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="phone" style={{ color: "#ffac96" }}>Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="\d{10}"
                  maxLength={10}
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  className="mt-1"
                  required
                  title="Enter a 10-digit phone number"
                />
              </div>
              <div>
                <Label htmlFor="department" style={{ color: "#ffac96" }}>Department</Label>
                <Select value={addForm.department} onValueChange={(v) => setAddForm({ ...addForm, department: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role" style={{ color: "#ffac96" }}>Role</Label>
                <Input id="role" value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })} className="mt-1" required maxLength={50} />
              </div>
              <div>
                <Label htmlFor="salary" style={{ color: "#ffac96" }}>Salary (₹)</Label>
                <Input id="salary" type="number" min={0} value={addForm.salary} onChange={(e) => setAddForm({ ...addForm, salary: e.target.value })} className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="joinDate" style={{ color: "#ffac96" }}>Join Date</Label>
                <Input id="joinDate" type="date" value={addForm.joinDate} onChange={(e) => setAddForm({ ...addForm, joinDate: e.target.value })} className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="status" style={{ color: "#ffac96" }}>Status</Label>
                <Select value={addForm.status} onValueChange={(v) => setAddForm({ ...addForm, status: v as StaffStatus })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" style={{ backgroundColor: "#610981" }} disabled={isAdding}>{isAdding ? "Adding..." : "Add Employee"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: "#ff691d" }}>Edit Employee</DialogTitle>
            <DialogDescription>Update employee details</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editName" style={{ color: "#ffac96" }}>Full Name</Label>
                  <Input id="editName" name="name" defaultValue={editing.name} className="mt-1" required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="editEmployeeId" style={{ color: "#ffac96" }}>Employee ID</Label>
                  <Input id="editEmployeeId" defaultValue={editing.employeeId} className="mt-1" disabled />
                </div>
                <div>
                  <Label htmlFor="editEmail" style={{ color: "#ffac96" }}>Email</Label>
                  <Input id="editEmail" name="email" type="email" defaultValue={editing.email} className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="editPhone" style={{ color: "#ffac96" }}>Phone</Label>
                  <Input
                    id="editPhone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="\d{10}"
                    maxLength={10}
                    defaultValue={editing.phone}
                    onChange={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 10); }}
                    className="mt-1"
                    required
                    title="Enter a 10-digit phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="editDepartment" style={{ color: "#ffac96" }}>Department</Label>
                  <Select name="department" defaultValue={editing.department}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editRole" style={{ color: "#ffac96" }}>Role</Label>
                  <Input id="editRole" name="role" defaultValue={editing.role} className="mt-1" required maxLength={50} />
                </div>
                <div>
                  <Label htmlFor="editSalary" style={{ color: "#ffac96" }}>Salary (₹)</Label>
                  <Input id="editSalary" name="salary" type="number" min={0} defaultValue={String(editing.salary)} className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="editJoinDate" style={{ color: "#ffac96" }}>Join Date</Label>
                  <Input id="editJoinDate" name="joinDate" type="date" defaultValue={toDateInput(editing.joinDate)} className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="editStatus" style={{ color: "#ffac96" }}>Status</Label>
                  <Select name="status" defaultValue={editing.status}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" style={{ backgroundColor: "#610981" }} disabled={isUpdating}>{isUpdating ? "Updating..." : "Update Employee"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
