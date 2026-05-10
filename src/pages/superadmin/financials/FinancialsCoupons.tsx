import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import {
  Plus,
  Search,
  IndianRupee,
  Ticket,
  Copy,
  Trash2,
  Edit,
  Percent,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../../../api/coupons";
import type { Coupon, CouponStatus, DiscountType } from "../../../api/types";

function getStatusColor(status: string) {
  switch (status) {
    case "active":
    case "ACTIVE":
      return "default" as const;
    case "expired":
    case "EXPIRED":
      return "secondary" as const;
    case "disabled":
    case "DISABLED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export function FinancialsCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponSearchQuery, setCouponSearchQuery] = useState("");
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCouponsLoading(true);
    const params = couponSearchQuery
      ? { q: couponSearchQuery, limit: 100 }
      : { limit: 100 };
    listCoupons("SUPERADMIN", params)
      .then((res) => {
        if (!cancelled) setCoupons(res.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load coupons";
          toast.error(message);
          setCoupons([]);
        }
      })
      .finally(() => {
        if (!cancelled) setCouponsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [couponSearchQuery]);

  const handleAddCoupon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const description = (fd.get("description") as string)?.trim();
    const maxDiscountRaw = fd.get("maxDiscount") as string;
    const body = {
      code: String(fd.get("code") ?? "").toUpperCase(),
      description: description ? description : undefined,
      discountType: fd.get("discountType") as DiscountType,
      discountValue: Number(fd.get("discountValue") ?? 0),
      minPurchaseAmount: Number(fd.get("minPurchase") ?? 0),
      maxDiscount: maxDiscountRaw ? Number(maxDiscountRaw) : null,
      usageLimit: Number(fd.get("usageLimit") ?? 0),
      validFrom: String(fd.get("validFrom") ?? ""),
      expiryDate: String(fd.get("expiryDate") ?? ""),
      status: fd.get("status") as CouponStatus,
    };

    try {
      if (editingCoupon) {
        const updated = await updateCoupon("SUPERADMIN", editingCoupon.id, body);
        setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast.success("Coupon updated successfully");
      } else {
        const created = await createCoupon("SUPERADMIN", body);
        setCoupons((prev) => [created, ...prev]);
        toast.success("Coupon created successfully");
      }
      setIsAddCouponOpen(false);
      setEditingCoupon(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save coupon";
      toast.error(message);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await deleteCoupon("SUPERADMIN", id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success("Coupon deleted successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete coupon";
      toast.error(message);
    }
  };

  const handleCopyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied to clipboard");
  };

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.status === "ACTIVE").length;
  const expiredCoupons = coupons.filter((c) => c.status === "EXPIRED").length;
  const totalUsage = coupons.reduce((sum, c) => sum + (c.usageCount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 justify-end">
        <Dialog
          open={isAddCouponOpen}
          onOpenChange={(open) => {
            setIsAddCouponOpen(open);
            if (!open) setEditingCoupon(null);
          }}
        >
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: "#610981", color: "white" }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleAddCoupon}>
              <DialogHeader>
                <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
                <DialogDescription>
                  {editingCoupon ? "Update coupon details" : "Add a new discount coupon for students"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="code">Coupon Code</Label>
                    <Input id="code" name="code" placeholder="WELCOME50" defaultValue={editingCoupon?.code} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={editingCoupon?.status || "ACTIVE"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="DISABLED">Disabled</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="10% off your first order"
                    defaultValue={editingCoupon?.description ?? ""}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="discountType">Discount Type</Label>
                    <Select name="discountType" defaultValue={editingCoupon?.discountType || "PERCENTAGE"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                        <SelectItem value="FLAT">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="discountValue">Discount Value</Label>
                    <Input
                      id="discountValue"
                      name="discountValue"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="50"
                      defaultValue={editingCoupon?.discountValue}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="minPurchase">Min Purchase Amount (₹)</Label>
                    <Input
                      id="minPurchase"
                      name="minPurchase"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="1000"
                      defaultValue={editingCoupon?.minPurchaseAmount}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxDiscount">Max Discount (₹) - Optional</Label>
                    <Input
                      id="maxDiscount"
                      name="maxDiscount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="500"
                      defaultValue={editingCoupon?.maxDiscount ?? ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="usageLimit">Usage Limit</Label>
                    <Input
                      id="usageLimit"
                      name="usageLimit"
                      type="number"
                      min="1"
                      placeholder="100"
                      defaultValue={editingCoupon?.usageLimit}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="validFrom">Valid From</Label>
                    <Input
                      id="validFrom"
                      name="validFrom"
                      type="date"
                      defaultValue={
                        editingCoupon?.validFrom?.slice(0, 10) ??
                        new Date().toISOString().slice(0, 10)
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    name="expiryDate"
                    type="date"
                    defaultValue={editingCoupon?.expiryDate?.slice(0, 10)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddCouponOpen(false);
                    setEditingCoupon(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" style={{ backgroundColor: "#610981", color: "white" }}>
                  {editingCoupon ? "Update" : "Create"} Coupon
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Total Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold flex items-center gap-2">
              <Ticket className="w-6 h-6" />
              {totalCoupons}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Active Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-green-500 flex items-center gap-2">
              {activeCoupons}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Total Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold flex items-center gap-2">{totalUsage}</div>
            <p className="text-sm text-muted-foreground mt-1">Times redeemed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ffac96" }}>Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-red-500 flex items-center gap-2">
              {expiredCoupons}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ color: "#ff691d" }}>Discount Coupons</CardTitle>
          <CardDescription>Manage promotional discount codes for NavYoga Academy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by coupon code or status..."
                value={couponSearchQuery}
                onChange={(e) => setCouponSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Purchase</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {couponsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading coupons…
                      </span>
                    </TableCell>
                  </TableRow>
                ) : coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No coupons found
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{coupon.code}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyCouponCode(coupon.code)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-semibold">
                          {coupon.discountType === "PERCENTAGE" ? (
                            <>
                              <Percent className="w-3 h-3" />
                              {Number(coupon.discountValue)}%
                            </>
                          ) : (
                            <>
                              <IndianRupee className="w-3 h-3" />
                              {Number(coupon.discountValue)}
                            </>
                          )}
                          {coupon.maxDiscount && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (max ₹{Number(coupon.maxDiscount)})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />
                          {Number(coupon.minPurchaseAmount)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {coupon.description ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-semibold">{coupon.usageCount}</span> /{" "}
                          {coupon.usageLimit}
                          <div className="text-xs text-muted-foreground">
                            {coupon.usageLimit > 0
                              ? `${Math.round((coupon.usageCount / coupon.usageLimit) * 100)}% used`
                              : "0% used"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(coupon.expiryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(coupon.status)} className="capitalize">
                          {coupon.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingCoupon(coupon);
                              setIsAddCouponOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
