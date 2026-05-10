import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Ticket, Plus, Search, Edit, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from "../../api/coupons";
import type { Coupon, CouponStatus, DiscountType } from "../../api/types";

const DISCOUNT_TYPES: { value: DiscountType; label: string }[] = [
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FLAT", label: "Flat Amount" },
];

const COUPON_STATUSES: { value: CouponStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "DISABLED", label: "Disabled" },
  { value: "EXPIRED", label: "Expired" },
];

const statusBadgeVariant = (status: CouponStatus): "default" | "secondary" | "outline" => {
  if (status === "ACTIVE") return "default";
  if (status === "EXPIRED") return "outline";
  return "secondary";
};

type CouponFormState = {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  maxDiscount: string;
  minPurchaseAmount: string;
  usageLimit: string;
  validFrom: string;
  expiryDate: string;
  status: CouponStatus;
};

const emptyForm: CouponFormState = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  maxDiscount: "",
  minPurchaseAmount: "0",
  usageLimit: "",
  validFrom: "",
  expiryDate: "",
  status: "ACTIVE",
};

export function OperationsCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CouponStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<CouponFormState>(emptyForm);

  const [editing, setEditing] = useState<Coupon | null>(null);
  const [editForm, setEditForm] = useState<CouponFormState>(emptyForm);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listCoupons("OPERATIONS", {
      q: debouncedTerm || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      limit: 20,
    })
      .then((res) => {
        if (cancelled) return;
        setCoupons(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load coupons.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedTerm, statusFilter, page, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const buildCreateBody = (form: CouponFormState) => ({
    code: form.code.trim().toUpperCase(),
    description: form.description || undefined,
    discountType: form.discountType,
    discountValue: form.discountValue,
    maxDiscount: form.maxDiscount ? form.maxDiscount : undefined,
    minPurchaseAmount: form.minPurchaseAmount || "0",
    usageLimit: Number(form.usageLimit) || 0,
    validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : "",
    expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : "",
    status: form.status,
  });

  const buildUpdateBody = (form: CouponFormState) => ({
    code: form.code.trim().toUpperCase(),
    description: form.description || null,
    discountType: form.discountType,
    discountValue: form.discountValue,
    maxDiscount: form.maxDiscount ? form.maxDiscount : null,
    minPurchaseAmount: form.minPurchaseAmount || "0",
    usageLimit: Number(form.usageLimit) || 0,
    validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : undefined,
    expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
    status: form.status,
  });

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isAdding) return;
    if (!addForm.validFrom || !addForm.expiryDate) {
      toast.error("Valid From and Valid Until are required.");
      return;
    }
    if (new Date(addForm.expiryDate) <= new Date(addForm.validFrom)) {
      toast.error("Valid Until must be after Valid From.");
      return;
    }
    setIsAdding(true);
    try {
      await createCoupon("OPERATIONS", buildCreateBody(addForm));
      toast.success("Coupon created successfully");
      setIsAddOpen(false);
      setAddForm(emptyForm);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create coupon.");
    } finally {
      setIsAdding(false);
    }
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setEditForm({
      code: coupon.code,
      description: coupon.description ?? "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : "",
      minPurchaseAmount: String(coupon.minPurchaseAmount),
      usageLimit: String(coupon.usageLimit),
      validFrom: coupon.validFrom ? coupon.validFrom.slice(0, 10) : "",
      expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : "",
      status: coupon.status,
    });
  };

  const handleEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || isUpdating) return;
    if (editForm.validFrom && editForm.expiryDate && new Date(editForm.expiryDate) <= new Date(editForm.validFrom)) {
      toast.error("Valid Until must be after Valid From.");
      return;
    }
    setIsUpdating(true);
    try {
      await updateCoupon("OPERATIONS", editing.id, buildUpdateBody(editForm));
      toast.success("Coupon updated successfully");
      setEditing(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update coupon.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon ${coupon.code}?`)) return;
    try {
      await deleteCoupon("OPERATIONS", coupon.id);
      toast.success("Coupon deleted successfully");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete coupon.");
    }
  };

  const metrics = [
    { title: "Total Coupons", value: String(total), icon: Ticket, color: "#ff691d" },
    { title: "Active (page)", value: String(coupons.filter((c) => c.status === "ACTIVE").length), icon: Ticket, color: "#10b981" },
    { title: "Disabled (page)", value: String(coupons.filter((c) => c.status === "DISABLED").length), icon: TrendingUp, color: "#610981" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: "#ff691d" }}>Coupon Code Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage promotional coupon codes</p>
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
                <CardContent><div className="text-2xl font-semibold">{metric.value}</div></CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle style={{ color: "#ff691d" }}>All Coupons</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none z-10" />
                  <Input
                    placeholder="Search coupons..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as CouponStatus | "ALL"); setPage(1); }}>
                  <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {COUPON_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={() => { setAddForm(emptyForm); setIsAddOpen(true); }} className="gap-2" style={{ backgroundColor: "#610981" }}>
                  <Plus className="w-4 h-4" />Create Coupon
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Code</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Discount</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Valid Period</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Usage</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Status</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && coupons.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                  ) : coupons.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No coupons found.</td></tr>
                  ) : (
                    coupons.map((coupon) => (
                      <tr key={coupon.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-mono font-medium">{coupon.code}</p>
                          {coupon.description && <p className="text-xs text-muted-foreground">{coupon.description}</p>}
                        </td>
                        <td className="py-3 px-4">
                          {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                          {coupon.maxDiscount && (
                            <p className="text-xs text-muted-foreground">max ₹{coupon.maxDiscount}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(coupon.validFrom).toLocaleDateString()}
                          <br />
                          <span className="text-muted-foreground">→ {new Date(coupon.expiryDate).toLocaleDateString()}</span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {coupon.usageCount} / {coupon.usageLimit}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusBadgeVariant(coupon.status)}>{coupon.status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(coupon)} className="hover:bg-blue-50">
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(coupon)} className="hover:bg-red-50">
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
            <DialogTitle style={{ color: "#ff691d" }}>Create New Coupon</DialogTitle>
            <DialogDescription>Set up a new promotional coupon code</DialogDescription>
          </DialogHeader>
          <CouponForm
            form={addForm}
            setForm={setAddForm}
            isSubmitting={isAdding}
            submitLabel="Create Coupon"
            onSubmit={handleAdd}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: "#ff691d" }}>Edit Coupon</DialogTitle>
            <DialogDescription>Update coupon details</DialogDescription>
          </DialogHeader>
          <CouponForm
            form={editForm}
            setForm={setEditForm}
            isSubmitting={isUpdating}
            submitLabel="Update Coupon"
            onSubmit={handleEdit}
            onCancel={() => setEditing(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CouponForm({
  form,
  setForm,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  form: CouponFormState;
  setForm: (form: CouponFormState) => void;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code" style={{ color: "#ffac96" }}>Coupon Code</Label>
          <Input
            id="code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="mt-1 font-mono"
            required
          />
        </div>
        <div>
          <Label htmlFor="discountType" style={{ color: "#ffac96" }}>Discount Type</Label>
          <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v as DiscountType })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DISCOUNT_TYPES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="discountValue" style={{ color: "#ffac96" }}>Discount Value</Label>
          <Input
            id="discountValue"
            type="number"
            min={0}
            step="0.01"
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="maxDiscount" style={{ color: "#ffac96" }}>Max Discount (optional)</Label>
          <Input
            id="maxDiscount"
            type="number"
            min={0}
            step="0.01"
            value={form.maxDiscount}
            onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
            className="mt-1"
            placeholder="Cap on percentage discount"
          />
        </div>
        <div>
          <Label htmlFor="minPurchaseAmount" style={{ color: "#ffac96" }}>Min Purchase Amount (₹)</Label>
          <Input
            id="minPurchaseAmount"
            type="number"
            min={0}
            step="0.01"
            value={form.minPurchaseAmount}
            onChange={(e) => setForm({ ...form, minPurchaseAmount: e.target.value })}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="usageLimit" style={{ color: "#ffac96" }}>Usage Limit</Label>
          <Input
            id="usageLimit"
            type="number"
            min={1}
            value={form.usageLimit}
            onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="validFrom" style={{ color: "#ffac96" }}>Valid From</Label>
          <Input
            id="validFrom"
            type="date"
            value={form.validFrom}
            onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="expiryDate" style={{ color: "#ffac96" }}>Valid Until</Label>
          <Input
            id="expiryDate"
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            className="mt-1"
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="status" style={{ color: "#ffac96" }}>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CouponStatus })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUPON_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description" style={{ color: "#ffac96" }}>Description (optional)</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1"
            rows={2}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" style={{ backgroundColor: "#610981" }} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
