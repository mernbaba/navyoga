import { useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Edit, Trash2, IndianRupee, Clock, Zap, Tag, CheckCircle2, Video, Radio, BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  listLivePlans,
  updateLivePlan,
  deleteLivePlan,
  listSelfPacedPlans,
  updateSelfPacedPlan,
  deleteSelfPacedPlan,
  listYTTRecordedCourses,
  listYTTRecordedPlans,
  updateYTTRecordedPlan,
  deleteYTTRecordedPlan,
  listYTTLiveCourses,
  listYTTLivePlans,
  updateYTTLivePlan,
  deleteYTTLivePlan,
} from "../../api/plans";
import type { LivePlan, SelfPacedPlan, YTTCourse, YTTPlan } from "../../api/types";

const formatINR = (val: string | number) =>
  `₹${Number(val).toLocaleString("en-IN")}`;

const featuresFromString = (raw: string): string[] =>
  raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

// ─── LIVE CLASSES (SUBSCRIPTION) PLANS TAB ───────────────────────────────────

function SubscriptionPlansTab() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = () => setRefreshKey((k) => k + 1);

  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFeaturesRaw, setEditFeaturesRaw] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listSubscriptionPlans()
      .then((res) => { if (!cancelled) setPlans(res); })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load plans.");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const openEdit = (plan: SubscriptionPlan) => {
    setEditing(plan);
    setEditFeaturesRaw(plan.features.join("\n"));
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing || isUpdating) return;
    setIsUpdating(true);
    const fd = new FormData(e.currentTarget);
    try {
      await updateSubscriptionPlan(editing.id, {
        name: String(fd.get("name") || ""),
        description: String(fd.get("description") || "") || undefined,
        period: fd.get("period") as MembershipPeriod,
        price: Number(fd.get("price")),
        originalPrice: fd.get("originalPrice") ? Number(fd.get("originalPrice")) : undefined,
        features: featuresFromString(editFeaturesRaw),
        canAccessLiveClasses: fd.get("canAccessLiveClasses") === "on",
        canAccessRecordings: fd.get("canAccessRecordings") === "on",
        isPopular: fd.get("isPopular") === "on",
        isBestValue: fd.get("isBestValue") === "on",
        isInaugural: fd.get("isInaugural") === "on",
        isActive: fd.get("isActive") === "on",
      });
      toast.success("Plan updated");
      setEditing(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update plan.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (plan: SubscriptionPlan) => {
    if (!confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) return;
    try {
      await deleteSubscriptionPlan(plan.id);
      toast.success("Plan deleted");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete plan.");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Recurring membership plans for live classes and recordings</p>

      {isLoading && plans.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      ) : plans.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No live class plans found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${!plan.isActive ? "opacity-60" : ""}`}>
              {(plan.isPopular || plan.isBestValue || plan.isInaugural) && (
                <div className="absolute -top-2.5 left-4 flex gap-1">
                  {plan.isPopular && <Badge className="bg-[#610981] text-white text-xs">Popular</Badge>}
                  {plan.isBestValue && <Badge className="bg-green-600 text-white text-xs">Best Value</Badge>}
                  {plan.isInaugural && <Badge className="bg-[#ff691d] text-white text-xs">Inaugural</Badge>}
                </div>
              )}
              <CardContent className="pt-6 pb-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-base leading-tight">{plan.name}</p>
                    <Badge variant="outline" className="mt-1 text-xs">{periodLabel(plan.period)}</Badge>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold">{formatINR(plan.price)}</p>
                    {plan.originalPrice && (
                      <p className="text-xs text-muted-foreground line-through">{formatINR(plan.originalPrice)}</p>
                    )}
                  </div>
                </div>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
                {plan.features.length > 0 && (
                  <ul className="space-y-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-1 pt-1">
                  {plan.canAccessLiveClasses && <Badge variant="secondary" className="text-xs">Live Classes</Badge>}
                  {plan.canAccessRecordings && <Badge variant="secondary" className="text-xs">Recordings</Badge>}
                  {!plan.isActive && <Badge variant="secondary" className="text-xs text-muted-foreground">Archived</Badge>}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(plan)}>
                    <Edit className="w-3.5 h-3.5 mr-1" />Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(plan)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {editing && (
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Plan</DialogTitle>
                <DialogDescription>Update subscription plan details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input name="name" defaultValue={editing.name} required maxLength={100} />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input name="description" defaultValue={editing.description ?? ""} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Period</Label>
                    <Select name="period" defaultValue={editing.period}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Price (₹)</Label>
                    <Input name="price" type="number" min={0} defaultValue={Number(editing.price)} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Original Price (₹)</Label>
                  <Input name="originalPrice" type="number" min={0} defaultValue={editing.originalPrice ? Number(editing.originalPrice) : ""} />
                </div>
                <div className="grid gap-2">
                  <Label>Features <span className="text-muted-foreground text-xs">(one per line)</span></Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={editFeaturesRaw}
                    onChange={(e) => setEditFeaturesRaw(e.target.value)}
                  />
                </div>
                <div className="space-y-3 pt-1">
                  {(
                    [
                      { name: "canAccessLiveClasses", label: "Access live classes", default: editing.canAccessLiveClasses },
                      { name: "canAccessRecordings", label: "Access recordings", default: editing.canAccessRecordings },
                      { name: "isPopular", label: "Mark as Popular", default: editing.isPopular },
                      { name: "isBestValue", label: "Mark as Best Value", default: editing.isBestValue },
                      { name: "isInaugural", label: "Inaugural offer", default: editing.isInaugural },
                      { name: "isActive", label: "Active", default: editing.isActive },
                    ]
                  ).map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <Label className="font-normal">{item.label}</Label>
                      <input type="checkbox" name={item.name} defaultChecked={item.default} className="sr-only peer" id={`edit-sub-${item.name}`} />
                      <label
                        htmlFor={`edit-sub-${item.name}`}
                        className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-muted peer-checked:bg-primary transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
                      />
                    </div>
                  ))}
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

// ─── SELF-PACED PLANS TAB ─────────────────────────────────────────────────────

function SelfPacedPlansTab() {
  const [plans, setPlans] = useState<SelfPacedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = () => setRefreshKey((k) => k + 1);

  const [editing, setEditing] = useState<SelfPacedPlan | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFeaturesRaw, setEditFeaturesRaw] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listSelfPacedPlans()
      .then((res) => { if (!cancelled) setPlans(res); })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load plans.");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const openEdit = (plan: SelfPacedPlan) => {
    setEditing(plan);
    setEditFeaturesRaw(plan.features.join("\n"));
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing || isUpdating) return;
    setIsUpdating(true);
    const fd = new FormData(e.currentTarget);
    try {
      await updateSelfPacedPlan(editing.id, {
        name: String(fd.get("name") || ""),
        description: String(fd.get("description") || "") || undefined,
        validity: Number(fd.get("validity")),
        price: Number(fd.get("price")),
        originalPrice: fd.get("originalPrice") ? Number(fd.get("originalPrice")) : undefined,
        features: featuresFromString(editFeaturesRaw),
        isActive: fd.get("isActive") === "on",
      });
      toast.success("Plan updated");
      setEditing(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update plan.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (plan: SelfPacedPlan) => {
    if (!confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) return;
    try {
      await deleteSelfPacedPlan(plan.id);
      toast.success("Plan deleted");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete plan.");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Time-limited access plans for self-paced course content</p>

      {isLoading && plans.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      ) : plans.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No self-paced plans yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${!plan.isActive ? "opacity-60" : ""}`}>
              <CardContent className="pt-6 pb-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-base leading-tight">{plan.name}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {plan.validity} days
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold">{formatINR(plan.price)}</p>
                    {plan.originalPrice && (
                      <p className="text-xs text-muted-foreground line-through">{formatINR(plan.originalPrice)}</p>
                    )}
                  </div>
                </div>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
                {plan.features.length > 0 && (
                  <ul className="space-y-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                {!plan.isActive && (
                  <Badge variant="secondary" className="text-xs text-muted-foreground">Archived</Badge>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(plan)}>
                    <Edit className="w-3.5 h-3.5 mr-1" />Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(plan)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {editing && (
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Plan</DialogTitle>
                <DialogDescription>Update self-paced plan details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input name="name" defaultValue={editing.name} required maxLength={100} />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input name="description" defaultValue={editing.description ?? ""} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Validity (days)</Label>
                    <Input name="validity" type="number" min={1} defaultValue={editing.validity} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Price (₹)</Label>
                    <Input name="price" type="number" min={0} defaultValue={Number(editing.price)} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Original Price (₹)</Label>
                  <Input name="originalPrice" type="number" min={0} defaultValue={editing.originalPrice ? Number(editing.originalPrice) : ""} />
                </div>
                <div className="grid gap-2">
                  <Label>Features <span className="text-muted-foreground text-xs">(one per line)</span></Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={editFeaturesRaw}
                    onChange={(e) => setEditFeaturesRaw(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Active</Label>
                  <input type="checkbox" name="isActive" defaultChecked={editing.isActive} className="sr-only peer" id="edit-sp-isActive" />
                  <label
                    htmlFor="edit-sp-isActive"
                    className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-muted peer-checked:bg-primary transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
                  />
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

// ─── YTT PLANS TAB (shared for Live + Recorded) ──────────────────────────────

type YTTPlanBody = { name: string; description?: string; validity: number; price: number; originalPrice?: number; features?: string[]; isActive: boolean };

type YTTPlansTabProps = {
  label: string;
  listCoursesFn: () => Promise<YTTCourse[]>;
  listPlansFn: (courseId: string) => Promise<YTTPlan[]>;
  updatePlanFn: (courseId: string, planId: string, body: Partial<YTTPlanBody>) => Promise<YTTPlan>;
  deletePlanFn: (courseId: string, planId: string) => Promise<null>;
};

type FlatPlan = { plan: YTTPlan; course: YTTCourse };

function YTTPlansTab({ label, listCoursesFn, listPlansFn, updatePlanFn, deletePlanFn }: YTTPlansTabProps) {
  const [flatPlans, setFlatPlans] = useState<FlatPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editing, setEditing] = useState<FlatPlan | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFeaturesRaw, setEditFeaturesRaw] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listCoursesFn()
      .then(async (loadedCourses) => {
        if (cancelled) return;
        const results = await Promise.allSettled(
          loadedCourses.map((c) => listPlansFn(c.id).then((plans) => plans.map((p) => ({ plan: p, course: c }))))
        );
        if (cancelled) return;
        const all: FlatPlan[] = [];
        results.forEach((r) => { if (r.status === "fulfilled") all.push(...r.value); });
        setFlatPlans(all);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load courses.");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey, listCoursesFn]);

  const refetchPlans = (courseId: string, course: YTTCourse) => {
    listPlansFn(courseId)
      .then((plans) => {
        setFlatPlans((prev) => [
          ...prev.filter((fp) => fp.course.id !== courseId),
          ...plans.map((p) => ({ plan: p, course })),
        ]);
      })
      .catch(() => {});
  };

  const openEdit = (fp: FlatPlan) => {
    setEditing(fp);
    setEditFeaturesRaw(fp.plan.features.join("\n"));
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing || isUpdating) return;
    setIsUpdating(true);
    const fd = new FormData(e.currentTarget);
    try {
      await updatePlanFn(editing.course.id, editing.plan.id, {
        name: String(fd.get("name") || ""),
        description: String(fd.get("description") || "") || undefined,
        validity: Number(fd.get("validity")),
        price: Number(fd.get("price")),
        originalPrice: fd.get("originalPrice") ? Number(fd.get("originalPrice")) : undefined,
        features: featuresFromString(editFeaturesRaw),
        isActive: fd.get("isActive") === "on",
      });
      toast.success("Plan updated");
      refetchPlans(editing.course.id, editing.course);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update plan.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (fp: FlatPlan) => {
    if (!confirm(`Delete plan "${fp.plan.name}"? This cannot be undone.`)) return;
    try {
      await deletePlanFn(fp.course.id, fp.plan.id);
      toast.success("Plan deleted");
      refetchPlans(fp.course.id, fp.course);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete plan.");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Manage {label} plans</p>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">Loading plans...</p>
      ) : flatPlans.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No {label} plans found.</p>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {flatPlans.map((fp) => (
              <div key={fp.plan.id} className={`p-3 border rounded-xl space-y-2 ${!fp.plan.isActive ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <BookOpen className="w-3 h-3 text-[#610981] shrink-0" />
                  <span className="text-xs text-[#610981] font-medium truncate">{fp.course.title}</span>
                  {!fp.course.isActive && <Badge variant="secondary" className="text-xs ml-auto shrink-0">Inactive Course</Badge>}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm leading-tight">{fp.plan.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3" />{fp.plan.validity} days
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">{formatINR(fp.plan.price)}</p>
                    {fp.plan.originalPrice && <p className="text-xs text-muted-foreground line-through">{formatINR(fp.plan.originalPrice)}</p>}
                  </div>
                </div>
                {fp.plan.features.length > 0 && (
                  <ul className="space-y-0.5">
                    {fp.plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                )}
                {!fp.plan.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => openEdit(fp)}>
                    <Edit className="w-3 h-3 mr-1" />Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(fp)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Edit plan dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {editing && (
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Plan</DialogTitle>
                <DialogDescription>{editing.course.title}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input name="name" defaultValue={editing.plan.name} required maxLength={100} />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input name="description" defaultValue={editing.plan.description ?? ""} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Validity (days)</Label>
                    <Input name="validity" type="number" min={1} defaultValue={editing.plan.validity} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Price (₹)</Label>
                    <Input name="price" type="number" min={0} defaultValue={Number(editing.plan.price)} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Original Price (₹)</Label>
                  <Input name="originalPrice" type="number" min={0} defaultValue={editing.plan.originalPrice ? Number(editing.plan.originalPrice) : ""} />
                </div>
                <div className="grid gap-2">
                  <Label>Features <span className="text-muted-foreground text-xs">(one per line)</span></Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={editFeaturesRaw}
                    onChange={(e) => setEditFeaturesRaw(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Active</Label>
                  <input type="checkbox" name="isActive" defaultChecked={editing.plan.isActive} className="sr-only peer" id="edit-ytt-isActive" />
                  <label htmlFor="edit-ytt-isActive" className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-muted peer-checked:bg-primary transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
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

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export function Plans() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#610981]/10 rounded-xl">
          <IndianRupee className="w-5 h-5 text-[#610981]" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold">Plans</h1>
          <p className="text-muted-foreground mt-0.5">Manage subscription and self-paced access plans</p>
        </div>
      </div>

      <Tabs defaultValue="subscription">
        <TabsList className="mb-2">
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />Live Classes
          </TabsTrigger>
          <TabsTrigger value="selfpaced" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />Self-Paced Plans
          </TabsTrigger>
          <TabsTrigger value="ytt-recorded" className="flex items-center gap-2">
            <Video className="w-4 h-4" />YTT Recorded
          </TabsTrigger>
          <TabsTrigger value="ytt-live" className="flex items-center gap-2">
            <Radio className="w-4 h-4" />YTT Live
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscription">
          <SubscriptionPlansTab />
        </TabsContent>

        <TabsContent value="selfpaced">
          <SelfPacedPlansTab />
        </TabsContent>

        <TabsContent value="ytt-recorded">
          <YTTPlansTab
            label="YTT Recorded"
            listCoursesFn={listYTTRecordedCourses}
            listPlansFn={listYTTRecordedPlans}
            updatePlanFn={updateYTTRecordedPlan}
            deletePlanFn={deleteYTTRecordedPlan}
          />
        </TabsContent>

        <TabsContent value="ytt-live">
          <YTTPlansTab
            label="YTT Live"
            listCoursesFn={listYTTLiveCourses}
            listPlansFn={listYTTLivePlans}
            updatePlanFn={updateYTTLivePlan}
            deletePlanFn={deleteYTTLivePlan}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
