import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Phone, Plus, Search, Edit, Trash2, TrendingUp, Users, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { listFrontline, createFrontline, updateFrontline, deleteFrontline } from "../../api/frontline";
import type { FrontlineAgentRow, StaffStatus } from "../../api/types";

const STATUSES: StaffStatus[] = ["ACTIVE", "ON_LEAVE", "TERMINATED"];

const EMPTY_ADD_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  salary: "",
  joinDate: new Date().toISOString().slice(0, 10),
};

function toDateInput(value: string): string {
  return value ? value.slice(0, 10) : "";
}

export function OperationsFrontlineTeam() {
  const [agents, setAgents] = useState<FrontlineAgentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StaffStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);

  const [editing, setEditing] = useState<FrontlineAgentRow | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listFrontline("OPERATIONS", {
      q: debouncedTerm || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      limit: 20,
    })
      .then((res) => {
        if (cancelled) return;
        setAgents(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load agents.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedTerm, statusFilter, page, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const activeCount = agents.filter((a) => a.status === "ACTIVE").length;
  const callsToday = agents.reduce((sum, a) => sum + a.callsToday, 0);
  const conversions = agents.reduce((sum, a) => sum + a.conversions, 0);

  const metrics = [
    { title: "Total Agents", value: String(total), icon: Users, color: "#ff691d" },
    { title: "Active (page)", value: String(activeCount), icon: Phone, color: "#10b981" },
    { title: "Calls Today (page)", value: String(callsToday), icon: Phone, color: "#610981" },
    { title: "Conversions (page)", value: String(conversions), icon: TrendingUp, color: "#f59e0b" },
  ];

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isAdding) return;
    const salaryNum = Number(addForm.salary);
    if (!Number.isFinite(salaryNum) || salaryNum < 0) {
      toast.error("Salary must be a non-negative number");
      return;
    }
    if (addForm.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/^\d{10}$/.test(addForm.phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    setIsAdding(true);
    try {
      await createFrontline("OPERATIONS", {
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        password: addForm.password,
        salary: salaryNum,
        joinDate: addForm.joinDate,
      });
      toast.success("Agent added successfully");
      setIsAddOpen(false);
      setAddForm(EMPTY_ADD_FORM);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add agent.");
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
      await updateFrontline("OPERATIONS", editing.id, {
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
      toast.success("Agent updated successfully");
      setEditing(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update agent.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (agent: FrontlineAgentRow) => {
    if (!confirm(`Delete ${agent.firstName} ${agent.lastName}? This cannot be undone.`)) return;
    try {
      await deleteFrontline("OPERATIONS", agent.id);
      toast.success("Agent deleted successfully");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete agent.");
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: "#ff691d" }}>Frontline Team Management</h1>
          <p className="text-muted-foreground mt-1">Manage lead generation team members and their performance</p>
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
              <CardTitle style={{ color: "#ff691d" }}>All Agents</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 z-10 pointer-events-none" />
                  <Input
                    placeholder="Search agents..."
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
                  <Plus className="w-4 h-4" />Add Agent
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Agent ID</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Name</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Calls Today</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Leads</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Conversions</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Performance</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Status</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && agents.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                  ) : agents.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">No agents found.</td></tr>
                  ) : (
                    agents.map((agent) => (
                      <tr key={agent.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium">{agent.employeeId}</span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{agent.firstName} {agent.lastName}</p>
                          <p className="text-sm text-muted-foreground">{agent.email}</p>
                        </td>
                        <td className="py-3 px-4">{agent.phone}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" style={{ borderColor: "#610981", color: "#610981" }}>
                            {agent.callsToday}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" style={{ borderColor: "#3b82f6", color: "#3b82f6" }}>
                            {agent.leadsAssigned}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" style={{ borderColor: "#10b981", color: "#10b981" }}>
                            {agent.conversions}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-16">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${agent.performance}%`,
                                  backgroundColor: agent.performance >= 90 ? "#10b981" : agent.performance >= 70 ? "#f59e0b" : "#ef4444",
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">{agent.performance}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={agent.status === "ACTIVE" ? "default" : "secondary"}>
                            {agent.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditing(agent)} className="hover:bg-blue-50">
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(agent)} className="hover:bg-red-50">
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
            <DialogTitle style={{ color: "#ff691d" }}>Add New Agent</DialogTitle>
            <DialogDescription>Employee ID is auto-assigned. Status defaults to Active.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" style={{ color: "#ffac96" }}>First Name</Label>
                <Input id="firstName" value={addForm.firstName} onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })} className="mt-1" required maxLength={50} />
              </div>
              <div>
                <Label htmlFor="lastName" style={{ color: "#ffac96" }}>Last Name</Label>
                <Input id="lastName" value={addForm.lastName} onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })} className="mt-1" required maxLength={50} />
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
                <Label htmlFor="password" style={{ color: "#ffac96" }}>Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="mt-1 pr-10"
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
              <div>
                <Label htmlFor="salary" style={{ color: "#ffac96" }}>Salary (₹)</Label>
                <Input id="salary" type="number" min={0} value={addForm.salary} onChange={(e) => setAddForm({ ...addForm, salary: e.target.value })} className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="joinDate" style={{ color: "#ffac96" }}>Join Date</Label>
                <Input id="joinDate" type="date" value={addForm.joinDate} onChange={(e) => setAddForm({ ...addForm, joinDate: e.target.value })} className="mt-1" required />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} disabled={isAdding}>Cancel</Button>
              <Button type="submit" style={{ backgroundColor: "#610981" }} disabled={isAdding}>{isAdding ? "Adding..." : "Add Agent"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: "#ff691d" }}>Edit Agent</DialogTitle>
            <DialogDescription>Update agent details</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName" style={{ color: "#ffac96" }}>First Name</Label>
                  <Input id="editFirstName" name="firstName" defaultValue={editing.firstName} className="mt-1" required maxLength={50} />
                </div>
                <div>
                  <Label htmlFor="editLastName" style={{ color: "#ffac96" }}>Last Name</Label>
                  <Input id="editLastName" name="lastName" defaultValue={editing.lastName} className="mt-1" required maxLength={50} />
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
                  <Label htmlFor="editDesignation" style={{ color: "#ffac96" }}>Designation</Label>
                  <Input id="editDesignation" name="designation" defaultValue={editing.designation} className="mt-1" maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="editDepartment" style={{ color: "#ffac96" }}>Department</Label>
                  <Input id="editDepartment" name="department" defaultValue={editing.department} className="mt-1" maxLength={50} />
                </div>
                <div>
                  <Label htmlFor="editDailyTarget" style={{ color: "#ffac96" }}>Daily Target</Label>
                  <Input id="editDailyTarget" name="dailyTarget" type="number" min={0} defaultValue={String(editing.dailyTarget)} className="mt-1" />
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
                <Button type="submit" style={{ backgroundColor: "#610981" }} disabled={isUpdating}>{isUpdating ? "Updating..." : "Update Agent"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
