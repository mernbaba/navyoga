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
import { Plus, Search, Edit, Trash2, Mail, Phone, Calendar, Eye, MapPin, FileText, Globe, User } from "lucide-react";
import { toast } from "sonner";
import { listLeads, createLead, updateLead, deleteLead, getLeadStats, type LeadStats } from "../../api/leads";
import { listFrontline } from "../../api/frontline";
import type { FrontlineAgentRow, Lead, LeadSource, LeadStatus, Role } from "../../api/types";
import { PHONE_PATTERN, PHONE_TITLE, PHONE_MIN_LENGTH, PHONE_MAX_LENGTH, sanitizePhone, handlePhoneInput, isValidPhone } from "../../lib/phone";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AddLeadErrors = Partial<Record<"name" | "email" | "phone" | "interest", string>>;

function validateAddLeadForm(form: { name: string; email: string; phone: string; interest: string }): AddLeadErrors {
  const errors: AddLeadErrors = {};
  if (!form.name.trim()) errors.name = "Full name is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (!form.phone.trim()) errors.phone = "Phone is required.";
  else if (!isValidPhone(form.phone)) errors.phone = `Phone must be ${PHONE_MIN_LENGTH}-${PHONE_MAX_LENGTH} digits.`;
  if (!form.interest.trim()) errors.interest = "Interest is required.";
  return errors;
}

// Sentinel used by the assignee <Select>s, since Radix Select cannot hold an empty-string value.
const UNASSIGNED = "__unassigned__";

const SOURCES: LeadSource[] = ["WEBSITE", "REFERRAL", "WALK_IN", "SOCIAL_MEDIA", "FACEBOOK", "INSTAGRAM", "GOOGLE_ADS"];
const STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "INTERESTED", "CONVERTED", "NOT_INTERESTED"];

function statusVariant(status: LeadStatus): "default" | "secondary" | "outline" | "destructive" {
  if (status === "NEW") return "default";
  if (status === "CONTACTED") return "secondary";
  if (status === "INTERESTED") return "secondary";
  if (status === "CONVERTED") return "default";
  return "outline";
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium">{value || <span className="text-muted-foreground italic">-</span>}</span>
    </div>
  );
}

type LeadsRole = Extract<Role, "SUPERADMIN" | "FRONTLINE" | "OPERATIONS">;

export function Leads({ role = "SUPERADMIN" }: { role?: LeadsRole } = {}) {
  // Frontline agents own their leads and cannot (re)assign them — the backend
  // self-assigns on create and rejects reassignment. Only admins/ops manage assignment.
  const canAssign = role !== "FRONTLINE";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [staff, setStaff] = useState<FrontlineAgentRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "WEBSITE" as LeadSource,
    page: "",
    interest: "",
    location: "",
    notes: "",
    assignedToId: UNASSIGNED,
  });
  const [addErrors, setAddErrors] = useState<AddLeadErrors>({});

  const [editing, setEditing] = useState<Lead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Lead | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, assigneeFilter]);

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
      assignedToId: assigneeFilter === "ALL" ? undefined : assigneeFilter,
      page,
      limit: 15,
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
  }, [debouncedQuery, statusFilter, assigneeFilter, page, refreshKey, role]);

  // Load the frontline roster once so admins/ops can pick an assignee and we can
  // render staff names in the table/detail views. Frontline agents skip this.
  useEffect(() => {
    if (!canAssign) return;
    let cancelled = false;
    listFrontline(role, { limit: 100 })
      .then((res) => {
        if (!cancelled) setStaff(res.items);
      })
      .catch(() => {
        /* non-critical; assignment simply shows IDs if this fails */
      });
    return () => {
      cancelled = true;
    };
  }, [canAssign, role]);

  const staffName = (id: string | null): string | null => {
    if (!id) return null;
    const match = staff.find((s) => s.id === id);
    return match ? `${match.firstName} ${match.lastName}`.trim() : id;
  };

  // Tracks which lead's inline assignee dropdown is mid-save, to disable it.
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const handleInlineAssign = async (lead: Lead, value: string) => {
    const nextId = value === UNASSIGNED ? null : value;
    if (nextId === lead.assignedToId) return;
    setAssigningId(lead.id);
    // Optimistically reflect the change; roll back on failure.
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, assignedToId: nextId } : l)),
    );
    try {
      await updateLead(role, lead.id, { assignedToId: nextId });
      toast.success(nextId ? `Assigned to ${staffName(nextId)}` : "Lead unassigned");
    } catch (error) {
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, assignedToId: lead.assignedToId } : l)),
      );
      toast.error(error instanceof Error ? error.message : "Failed to assign lead.");
    } finally {
      setAssigningId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    getLeadStats(role)
      .then((res) => {
        if (!cancelled) setStats(res);
      })
      .catch(() => {
        /* stats are non-critical; leave previous values in place */
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, role]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isAdding) return;
    const errors = validateAddLeadForm(addForm);
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      const firstInvalid = (["name", "email", "phone", "interest"] as const).find((field) => errors[field]);
      if (firstInvalid) document.getElementById(firstInvalid)?.focus();
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setAddErrors({});
    setIsAdding(true);
    try {
      await createLead(role, {
        name: addForm.name,
        email: addForm.email,
        phone: addForm.phone,
        source: addForm.source,
        page: addForm.page || undefined,
        interest: addForm.interest,
        location: addForm.location || undefined,
        notes: addForm.notes || undefined,
        ...(canAssign && addForm.assignedToId !== UNASSIGNED
          ? { assignedToId: addForm.assignedToId }
          : {}),
      });
      toast.success("Lead added successfully");
      setIsAddOpen(false);
      setAddForm({ name: "", email: "", phone: "", source: "WEBSITE", page: "", interest: "", location: "", notes: "", assignedToId: UNASSIGNED });
      setAddErrors({});
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add lead.";
      const duplicateField = /this email already exists/i.test(message)
        ? "email"
        : /this phone already exists/i.test(message)
          ? "phone"
          : undefined;
      if (duplicateField) {
        setAddErrors((prev) => ({ ...prev, [duplicateField]: message }));
        document.getElementById(duplicateField)?.focus();
      }
      toast.error(message);
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
    const assignedToId = String(fd.get("assignedToId") || "");
    try {
      await updateLead(role, editing.id, {
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        source: fd.get("source") as LeadSource,
        status: fd.get("status") as LeadStatus,
        page: String(fd.get("page") || "") || null,
        interest: String(fd.get("interest") || ""),
        location: String(fd.get("location") || "") || null,
        notes: String(fd.get("notes") || "") || null,
        lastContactDate: lastContactDate || null,
        ...(canAssign
          ? { assignedToId: assignedToId && assignedToId !== UNASSIGNED ? assignedToId : null }
          : {}),
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
        <Dialog
          open={isAddOpen}
          onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) setAddErrors({});
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleAdd} noValidate>
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>Enter the details of the new lead</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={addForm.name}
                    onChange={(e) => {
                      setAddForm({ ...addForm, name: e.target.value });
                      if (addErrors.name) setAddErrors({ ...addErrors, name: undefined });
                    }}
                    required
                    maxLength={100}
                    aria-invalid={!!addErrors.name}
                  />
                  {addErrors.name && <p className="text-xs text-red-500">{addErrors.name}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={addForm.email}
                    onChange={(e) => {
                      setAddForm({ ...addForm, email: e.target.value });
                      if (addErrors.email) setAddErrors({ ...addErrors, email: undefined });
                    }}
                    required
                    aria-invalid={!!addErrors.email}
                  />
                  {addErrors.email && <p className="text-xs text-red-500">{addErrors.email}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    pattern={PHONE_PATTERN}
                    title={PHONE_TITLE}
                    value={addForm.phone}
                    onChange={(e) => {
                      setAddForm({ ...addForm, phone: sanitizePhone(e.target.value) });
                      if (addErrors.phone) setAddErrors({ ...addErrors, phone: undefined });
                    }}
                    required
                    minLength={PHONE_MIN_LENGTH}
                    maxLength={PHONE_MAX_LENGTH}
                    aria-invalid={!!addErrors.phone}
                  />
                  {addErrors.phone && <p className="text-xs text-red-500">{addErrors.phone}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source">Source <span className="text-red-500">*</span></Label>
                  <Select value={addForm.source} onValueChange={(v) => setAddForm({ ...addForm, source: v as LeadSource })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-page">Page</Label>
                  <Input id="add-page" value={addForm.page} onChange={(e) => setAddForm({ ...addForm, page: e.target.value })} placeholder="e.g., /yoga-live, /home" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="interest">Interest <span className="text-red-500">*</span></Label>
                  <Input
                    id="interest"
                    value={addForm.interest}
                    onChange={(e) => {
                      setAddForm({ ...addForm, interest: e.target.value });
                      if (addErrors.interest) setAddErrors({ ...addErrors, interest: undefined });
                    }}
                    placeholder="e.g., Hatha Yoga - beginner"
                    required
                    aria-invalid={!!addErrors.interest}
                  />
                  {addErrors.interest && <p className="text-xs text-red-500">{addErrors.interest}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} maxLength={100} />
                </div>
                {canAssign && (
                  <div className="grid gap-2">
                    <Label htmlFor="assignedTo">Assign To</Label>
                    <Select value={addForm.assignedToId} onValueChange={(v) => setAddForm({ ...addForm, assignedToId: v })}>
                      <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddOpen(false);
                    setAddErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isAdding}>{isAdding ? "Adding..." : "Add Lead"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Total Leads</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{stats?.total ?? "-"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>New</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-blue-500">{stats?.new ?? "-"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Interested</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-yellow-500">{stats?.interested ?? "-"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Converted</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-green-500">{stats?.converted ?? "-"}</div></CardContent>
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
            {canAssign && (
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="md:w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All assignees</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Status</TableHead>
                  {canAssign && <TableHead>Assigned To</TableHead>}
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && leads.length === 0 ? (
                  <TableRow><TableCell colSpan={canAssign ? 9 : 8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : leads.length === 0 ? (
                  <TableRow><TableCell colSpan={canAssign ? 9 : 8} className="text-center py-8 text-muted-foreground">No leads found.</TableCell></TableRow>
                ) : (
                  leads.map((lead, index) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{(page - 1) * 15 + index + 1}</TableCell>
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
                      {canAssign && (
                        <TableCell>
                          <Select
                            value={lead.assignedToId ?? UNASSIGNED}
                            disabled={assigningId === lead.id}
                            onValueChange={(v) => handleInlineAssign(lead, v)}
                          >
                            <SelectTrigger className="h-8 w-40 text-sm">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={UNASSIGNED}>
                                <span className="text-muted-foreground">Unassigned</span>
                              </SelectItem>
                              {staff.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />{new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setViewing(lead)}>
                            <Eye className="w-4 h-4" />
                          </Button>
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

          {total > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
              </p>
              {total > 15 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 15)}</span>
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 15)} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          {viewing && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="text-xl">{viewing.name}</DialogTitle>
                    <p className="text-xs text-muted-foreground font-mono mt-1">ID: {viewing.id}</p>
                  </div>
                  <Badge variant={statusVariant(viewing.status)} className="shrink-0 mt-1">
                    {viewing.status.replace("_", " ")}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-2">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailRow label="Email" value={viewing.email} />
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailRow label="Phone" value={viewing.phone} />
                </div>
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailRow label="Source" value={viewing.source.replace(/_/g, " ")} />
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailRow label="Page" value={viewing.page} />
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailRow label="Interest" value={viewing.interest} />
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailRow label="Location" value={viewing.location} />
                </div>
                {canAssign && (
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <DetailRow label="Assigned To" value={staffName(viewing.assignedToId)} />
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailRow
                    label="Last Contact Date"
                    value={viewing.lastContactDate ? new Date(viewing.lastContactDate).toLocaleDateString() : null}
                  />
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <DetailRow label="Created At" value={new Date(viewing.createdAt).toLocaleString()} />
                </div>
                {viewing.notes && (
                  <div className="md:col-span-2 flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <DetailRow label="Notes" value={viewing.notes} />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
                <Button
                  onClick={() => {
                    setEditing(viewing);
                    setViewing(null);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Lead
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          {editing && (
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Lead</DialogTitle>
                <DialogDescription>Update lead status and details</DialogDescription>
                <p className="text-xs text-muted-foreground mt-1">
                  LEAD ID: <span className="font-mono">{editing.id}</span>
                </p>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name <span className="text-red-500">*</span></Label>
                  <Input id="edit-name" name="name" defaultValue={editing.name} required maxLength={100} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email <span className="text-red-500">*</span></Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={editing.email} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone <span className="text-red-500">*</span></Label>
                  <Input id="edit-phone" name="phone" type="tel" inputMode="numeric" pattern={PHONE_PATTERN} title={PHONE_TITLE} defaultValue={editing.phone} onInput={handlePhoneInput} required minLength={PHONE_MIN_LENGTH} maxLength={PHONE_MAX_LENGTH} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-source">Source <span className="text-red-500">*</span></Label>
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
                  <Label htmlFor="edit-page">Page</Label>
                  <Input id="edit-page" name="page" defaultValue={editing.page ?? ""} placeholder="e.g., /yoga-live, /home" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-interest">Interest <span className="text-red-500">*</span></Label>
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
                {canAssign && (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-assignedTo">Assign To</Label>
                    <Select name="assignedToId" defaultValue={editing.assignedToId ?? UNASSIGNED}>
                      <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
