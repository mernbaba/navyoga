import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { GraduationCap, Plus, Search, Edit, Trash2, Award } from "lucide-react";
import { toast } from "sonner";
import { listTutors, createTutor, updateTutor, deleteTutor } from "../../api/tutors";
import type { StaffStatus, Tutor } from "../../api/types";

const STATUSES: StaffStatus[] = ["ACTIVE", "ON_LEAVE", "TERMINATED"];

export function OperationsTutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StaffStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    experience: "",
    specializations: "",
    bio: "",
  });

  const [editing, setEditing] = useState<Tutor | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listTutors("OPERATIONS", {
      q: debouncedTerm || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      limit: 20,
    })
      .then((res) => {
        if (cancelled) return;
        setTutors(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load tutors.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedTerm, statusFilter, page, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const activeCount = tutors.filter((t) => t.status === "ACTIVE").length;

  const metrics = [
    { title: "Total Tutors", value: String(total), icon: GraduationCap, color: "#ff691d" },
    { title: "Active (page)", value: String(activeCount), icon: GraduationCap, color: "#10b981" },
    { title: "Avg Experience", value: tutors.length ? `${Math.round(tutors.reduce((s, t) => s + t.experience, 0) / tutors.length)} yr` : "—", icon: Award, color: "#f59e0b" },
  ];

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isAdding) return;
    setIsAdding(true);
    try {
      await createTutor("OPERATIONS", {
        name: addForm.name,
        email: addForm.email,
        phone: addForm.phone,
        password: addForm.password,
        experience: Number(addForm.experience) || 0,
        specializations: addForm.specializations.split(",").map((s) => s.trim()).filter(Boolean),
        bio: addForm.bio || undefined,
      });
      toast.success("Tutor added successfully");
      setIsAddOpen(false);
      setAddForm({ name: "", email: "", phone: "", password: "", experience: "", specializations: "", bio: "" });
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add tutor.");
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
      await updateTutor("OPERATIONS", editing.id, {
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        experience: Number(fd.get("experience") || 0),
        specializations: String(fd.get("specializations") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        bio: String(fd.get("bio") || "") || null,
        status: fd.get("status") as StaffStatus,
      });
      toast.success("Tutor updated successfully");
      setEditing(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update tutor.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (tutor: Tutor) => {
    if (!confirm(`Delete ${tutor.name}? This cannot be undone.`)) return;
    try {
      await deleteTutor("OPERATIONS", tutor.id);
      toast.success("Tutor deleted successfully");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete tutor.");
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: "#ff691d" }}>Tutor Management</h1>
          <p className="text-muted-foreground mt-1">Manage yoga instructors and their assignments</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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
              <CardTitle style={{ color: "#ff691d" }}>All Tutors</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search tutors..."
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
                  <Plus className="w-4 h-4" />Add Tutor
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Tutor</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Specializations</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Experience</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Status</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && tutors.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                  ) : tutors.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No tutors found.</td></tr>
                  ) : (
                    tutors.map((tutor) => (
                      <tr key={tutor.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium">{tutor.name}</p>
                          <p className="text-sm text-muted-foreground">{tutor.email}</p>
                          <p className="text-xs text-muted-foreground">{tutor.tutorId}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {tutor.specializations.map((s) => (
                              <Badge key={s} variant="outline" style={{ borderColor: "#610981", color: "#610981" }}>{s}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">{tutor.experience} years</td>
                        <td className="py-3 px-4">
                          <Badge variant={tutor.status === "ACTIVE" ? "default" : "secondary"}>{tutor.status.replace("_", " ")}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditing(tutor)} className="hover:bg-blue-50">
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(tutor)} className="hover:bg-red-50">
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

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: "#ff691d" }}>Add New Tutor</DialogTitle>
            <DialogDescription>Fill in the details to add a new tutor</DialogDescription>
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
                <Input id="phone" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} className="mt-1" required minLength={7} maxLength={15} />
              </div>
              <div>
                <Label htmlFor="password" style={{ color: "#ffac96" }}>Password</Label>
                <Input id="password" type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} className="mt-1" required minLength={8} maxLength={128} />
              </div>
              <div>
                <Label htmlFor="experience" style={{ color: "#ffac96" }}>Experience (years)</Label>
                <Input id="experience" type="number" min={0} max={80} value={addForm.experience} onChange={(e) => setAddForm({ ...addForm, experience: e.target.value })} className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="specializations" style={{ color: "#ffac96" }}>Specializations</Label>
                <Input id="specializations" placeholder="Hatha, Vinyasa, Yin" value={addForm.specializations} onChange={(e) => setAddForm({ ...addForm, specializations: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="bio" style={{ color: "#ffac96" }}>Bio</Label>
              <Textarea id="bio" value={addForm.bio} onChange={(e) => setAddForm({ ...addForm, bio: e.target.value })} className="mt-1" rows={3} maxLength={2000} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" style={{ backgroundColor: "#610981" }} disabled={isAdding}>{isAdding ? "Adding..." : "Add Tutor"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: "#ff691d" }}>Edit Tutor</DialogTitle>
            <DialogDescription>Update tutor details</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editName" style={{ color: "#ffac96" }}>Full Name</Label>
                  <Input id="editName" name="name" defaultValue={editing.name} className="mt-1" required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="editEmail" style={{ color: "#ffac96" }}>Email</Label>
                  <Input id="editEmail" name="email" type="email" defaultValue={editing.email} className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="editPhone" style={{ color: "#ffac96" }}>Phone</Label>
                  <Input id="editPhone" name="phone" defaultValue={editing.phone} className="mt-1" required minLength={7} maxLength={15} />
                </div>
                <div>
                  <Label htmlFor="editExperience" style={{ color: "#ffac96" }}>Experience (years)</Label>
                  <Input id="editExperience" name="experience" type="number" min={0} max={80} defaultValue={editing.experience} className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="editSpecializations" style={{ color: "#ffac96" }}>Specializations</Label>
                  <Input id="editSpecializations" name="specializations" defaultValue={editing.specializations.join(", ")} className="mt-1" />
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
              <div>
                <Label htmlFor="editBio" style={{ color: "#ffac96" }}>Bio</Label>
                <Textarea id="editBio" name="bio" defaultValue={editing.bio ?? ""} className="mt-1" rows={3} maxLength={2000} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" style={{ backgroundColor: "#610981" }} disabled={isUpdating}>{isUpdating ? "Updating..." : "Update Tutor"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
