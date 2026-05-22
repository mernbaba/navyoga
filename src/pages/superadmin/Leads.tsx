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
import { Plus, Search, Edit, Trash2, Mail, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";
import { listLeads, createLead, updateLead, deleteLead } from "../../api/leads";
import type { Lead, LeadSource, LeadStatus, Role } from "../../api/types";

const SOURCES: LeadSource[] = ["WEBSITE", "REFERRAL", "WALK_IN", "SOCIAL_MEDIA", "FACEBOOK", "INSTAGRAM", "GOOGLE_ADS"];
const STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "INTERESTED", "CONVERTED", "NOT_INTERESTED"];

function statusVariant(status: LeadStatus): "default" | "secondary" | "outline" | "destructive" {
  if (status === "NEW") return "default";
  if (status === "CONTACTED") return "secondary";
  if (status === "INTERESTED") return "secondary";
  if (status === "CONVERTED") return "default";
  return "outline";
}

type LeadsRole = Extract<Role, "SUPERADMIN" | "FRONTLINE" | "OPERATIONS">;

export function Leads({ role = "SUPERADMIN" }: { role?: LeadsRole } = {}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "WEBSITE" as LeadSource,
    interest: "",
    location: "",
    notes: "",
  });

  const [editing, setEditing] = useState<Lead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listLeads(role, {
      q: debouncedQuery || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      limit: 20,
    })
      .then((res) => {
        if (cancelled) return;
        setLeads(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load leads.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, statusFilter, page, refreshKey, role]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isAdding) return;
    setIsAdding(true);
    try {
      await createLead(role, {
        name: addForm.name,
        email: addForm.email,
        phone: addForm.phone,
        source: addForm.source,
        interest: addForm.interest,
        location: addForm.location || undefined,
        notes: addForm.notes || undefined,
      });
      toast.success("Lead added successfully");
      setIsAddOpen(false);
      setAddForm({ name: "", email: "", phone: "", source: "WEBSITE", interest: "", location: "", notes: "" });
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add lead.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (lead: Lead) => {
    if (deletingId) return;
    if (!confirm(`Delete lead "${lead.name}" (${lead.id})? This cannot be undone.`)) return;
    setDeletingId(lead.id);
    try {
      await deleteLead(role, lead.id);
      toast.success("Lead deleted successfully");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete lead.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || isUpdating) return;
    setIsUpdating(true);
    const fd = new FormData(event.currentTarget);
    const lastContactDate = String(fd.get("lastContactDate") || "");
    try {
      await updateLead(role, editing.id, {
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        source: fd.get("source") as LeadSource,
        status: fd.get("status") as LeadStatus,
        interest: String(fd.get("interest") || ""),
        location: String(fd.get("location") || "") || null,
        notes: String(fd.get("notes") || "") || null,
        lastContactDate: lastContactDate || null,
      });
      toast.success("Lead updated successfully");
      setEditing(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update lead.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Leads</h1>
          <p className="text-muted-foreground mt-1">Manage potential students and inquiries</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>Enter the details of the new lead</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
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
                  <Input id="phone" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} required maxLength={15} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Select value={addForm.source} onValueChange={(v) => setAddForm({ ...addForm, source: v as LeadSource })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="interest">Interest</Label>
                  <Input id="interest" value={addForm.interest} onChange={(e) => setAddForm({ ...addForm, interest: e.target.value })} placeholder="e.g., Hatha Yoga - beginner" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} maxLength={100} />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isAdding}>{isAdding ? "Adding..." : "Add Lead"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Total Leads</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>New (page)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-blue-500">{leads.filter((l) => l.status === "NEW").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Interested (page)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-yellow-500">{leads.filter((l) => l.status === "INTERESTED").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Converted (page)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-green-500">{leads.filter((l) => l.status === "CONVERTED").length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>All Leads</CardTitle>
            <CardDescription>Track and manage your sales pipeline</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none z-10" />
              <Input
                placeholder="Search by name, email, or lead ID..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as LeadStatus | "ALL"); setPage(1); }}>
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
                  <TableHead>Source</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && leads.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : leads.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No leads found.</TableCell></TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.id}</TableCell>
                      <TableCell>{lead.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm"><Mail className="w-3 h-3 text-muted-foreground" />{lead.email}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-3 h-3" />{lead.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{lead.source.replace("_", " ").toLowerCase()}</Badge></TableCell>
                      <TableCell>{lead.interest}</TableCell>
                      <TableCell><Badge variant={statusVariant(lead.status)}>{lead.status.replace("_", " ")}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />{new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditing(lead)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(lead)}
                            disabled={deletingId === lead.id}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
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
        <DialogContent className="max-w-2xl">
          {editing && (
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Lead</DialogTitle>
                <DialogDescription>Update lead status and details</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
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
                  <Input id="edit-phone" name="phone" defaultValue={editing.phone} required maxLength={15} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-source">Source</Label>
                  <Select name="source" defaultValue={editing.source}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={editing.status}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-interest">Interest</Label>
                  <Input id="edit-interest" name="interest" defaultValue={editing.interest} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input id="edit-location" name="location" defaultValue={editing.location ?? ""} maxLength={100} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-lastContactDate">Last Contact Date</Label>
                  <Input id="edit-lastContactDate" name="lastContactDate" type="date" defaultValue={editing.lastContactDate ? editing.lastContactDate.slice(0, 10) : ""} />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea id="edit-notes" name="notes" defaultValue={editing.notes ?? ""} rows={3} />
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
