import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Plus, Search, Edit, Trash2, Mail, Phone, Award } from "lucide-react";
import { toast } from "sonner";
import { listTutors, createTutor, updateTutor, deleteTutor } from "../../api/tutors";
import type { StaffStatus, Tutor } from "../../api/types";

const STATUSES: StaffStatus[] = ["ACTIVE", "ON_LEAVE", "TERMINATED"];

function statusBadgeVariant(status: StaffStatus): "default" | "secondary" | "outline" {
  if (status === "ACTIVE") return "default";
  if (status === "ON_LEAVE") return "secondary";
  return "outline";
}

export function Tutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StaffStatus | "ALL">("ALL");
  const [debouncedQuery, setDebouncedQuery] = useState("");
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

  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listTutors("SUPERADMIN", {
      q: debouncedQuery || undefined,
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
  }, [debouncedQuery, statusFilter, page, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const activeCount = tutors.filter((t) => t.status === "ACTIVE").length;
  const onLeaveCount = tutors.filter((t) => t.status === "ON_LEAVE").length;

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isAdding) return;
    setIsAdding(true);
    try {
      await createTutor("SUPERADMIN", {
        name: addForm.name,
        email: addForm.email,
        phone: addForm.phone,
        password: addForm.password,
        experience: Number(addForm.experience) || 0,
        specializations: addForm.specializations
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        bio: addForm.bio || undefined,
      });
      toast.success("Tutor added successfully.");
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
    if (!editingTutor || isUpdating) return;
    setIsUpdating(true);
    const formData = new FormData(event.currentTarget);
    try {
      await updateTutor("SUPERADMIN", editingTutor.id, {
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        experience: Number(formData.get("experience") || 0),
        specializations: String(formData.get("specializations") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        bio: String(formData.get("bio") || "") || null,
        status: formData.get("status") as StaffStatus,
      });
      toast.success("Tutor updated successfully.");
      setEditingTutor(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update tutor.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (tutor: Tutor) => {
    if (!confirm(`Remove ${tutor.name}? This cannot be undone.`)) return;
    try {
      await deleteTutor("SUPERADMIN", tutor.id);
      toast.success("Tutor removed.");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove tutor.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Yoga Shikshaks</h1>
          <p className="text-muted-foreground mt-1">Manage your Yoga Shikshaks</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Yoga Shikshak
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Add New Yoga Shikshak</DialogTitle>
                <DialogDescription>Enter the details of the new yoga shikshak</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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
                  <Input id="phone" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} required minLength={7} maxLength={15} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} required minLength={8} maxLength={128} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="specializations">Specializations</Label>
                  <Input id="specializations" placeholder="Hatha, Vinyasa, Yin (comma separated)" value={addForm.specializations} onChange={(e) => setAddForm({ ...addForm, specializations: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input id="experience" type="number" min={0} max={80} value={addForm.experience} onChange={(e) => setAddForm({ ...addForm, experience: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" value={addForm.bio} onChange={(e) => setAddForm({ ...addForm, bio: e.target.value })} maxLength={2000} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isAdding}>{isAdding ? "Adding..." : "Add Yoga Shikshak"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Total Yoga Shikshaks</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active (this page)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-green-500">{activeCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>On Leave (this page)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-yellow-500">{onLeaveCount}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>All Yoga Shikshaks</CardTitle>
            <CardDescription>View and manage yoga shikshak information</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, email, or tutor ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StaffStatus | "ALL"); setPage(1); }}>
              <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
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
                  <TableHead>Specialization</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && tutors.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : tutors.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No tutors found.</TableCell></TableRow>
                ) : (
                  tutors.map((tutor) => (
                    <TableRow key={tutor.id}>
                      <TableCell className="font-medium">{tutor.tutorId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                            {tutor.name.charAt(0)}
                          </div>
                          {tutor.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm"><Mail className="w-3 h-3 text-muted-foreground" />{tutor.email}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-3 h-3" />{tutor.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tutor.specializations.map((spec) => <Badge key={spec} variant="secondary" className="text-xs">{spec}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1"><Award className="w-4 h-4 text-muted-foreground" />{tutor.experience} years</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(tutor.status)}>{tutor.status.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingTutor(tutor)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(tutor)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

      <Dialog open={!!editingTutor} onOpenChange={() => setEditingTutor(null)}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Yoga Shikshak</DialogTitle>
              <DialogDescription>Update yoga shikshak information</DialogDescription>
            </DialogHeader>
            {editingTutor && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input id="edit-name" name="name" defaultValue={editingTutor.name} required maxLength={100} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={editingTutor.email} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" name="phone" defaultValue={editingTutor.phone} required minLength={7} maxLength={15} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-specializations">Specializations</Label>
                  <Input id="edit-specializations" name="specializations" defaultValue={editingTutor.specializations.join(", ")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-experience">Years of Experience</Label>
                  <Input id="edit-experience" name="experience" type="number" min={0} max={80} defaultValue={editingTutor.experience} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-bio">Bio</Label>
                  <Textarea id="edit-bio" name="bio" defaultValue={editingTutor.bio ?? ""} maxLength={2000} rows={3} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={editingTutor.status}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingTutor(null)}>Cancel</Button>
              <Button type="submit" disabled={isUpdating}>{isUpdating ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
