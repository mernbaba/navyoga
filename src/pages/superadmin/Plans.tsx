import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
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
import { Edit, IndianRupee, Zap, Tag, Check, Video, Radio, Heart, GraduationCap, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  listLivePlans,
  createLivePlan,
  updateLivePlan,
  listSelfPacedPlans,
  updateSelfPacedPlan,
  listYTTRecordedCourses,
  listYTTRecordedPlans,
  updateYTTRecordedPlan,
  listYTTLiveCourses,
  listYTTLivePlans,
  updateYTTLivePlan,
} from "../../api/plans";
import type { LivePlan, SelfPacedPlan, YTTCourse, YTTPlan } from "../../api/types";

const formatINR = (val: string | number) =>
  `₹${Number(val).toLocaleString("en-IN")}`;

const featuresFromString = (raw: string): string[] =>
  raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

const PLAN_COLOR = "#ff691d";

const formatValidity = (days: number) => {
  if (days <= 31) return "month";
  if (days <= 95) return "3 months";
  if (days <= 190) return "6 months";
  if (days <= 380) return "12 months";
  return `${days} days`;
};

type PlanCardProps = {
  icon: ReactNode;
  name: string;
  price: number;
  originalPrice?: number | null;
  validity: number;
  description?: string | null;
  features: string[];
  isActive: boolean;
  topRightSlot?: ReactNode;
  badgeRow?: ReactNode;
  onEdit: () => void;
  color?: string;
};

function PlanCard({
  icon,
  name,
  price,
  originalPrice,
  validity,
  description,
  features,
  isActive,
  topRightSlot,
  badgeRow,
  onEdit,
  color = PLAN_COLOR,
}: PlanCardProps) {
  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-2xl hover:scale-[1.02] border-2 h-full group ${!isActive ? "opacity-60" : ""}`}
    >
      {topRightSlot && <div className="absolute top-4 right-4 z-10">{topRightSlot}</div>}
      {!isActive && !topRightSlot && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="secondary" className="text-xs">Archived</Badge>
        </div>
      )}

      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ backgroundColor: color }}
      />

      <CardHeader>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl" style={{ backgroundColor: `${color}20` }}>
            {icon}
          </div>
          <CardTitle className="text-2xl truncate" style={{ color }}>
            {name}
          </CardTitle>
        </div>

        <div className="mt-2">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-5xl font-bold">{formatINR(price)}</span>
            <span className="text-sm text-muted-foreground">+ GST</span>
            {originalPrice ? (
              <span className="text-base text-muted-foreground line-through">
                {formatINR(originalPrice)}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground mt-1">for {formatValidity(validity)}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}

        {features.length > 0 && (
          <div className="space-y-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="w-5 h-5 shrink-0 mt-0.5" style={{ color }} />
                <span className="text-sm leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
        )}

        {badgeRow}

        <Button
          variant="outline"
          className="w-full py-6 text-base font-semibold rounded-xl border-2"
          style={{ borderColor: color, color }}
          onClick={onEdit}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Plan
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── LIVE CLASSES PLANS TAB ──────────────────────────────────────────────────

function LivePlansTab() {
  const [plans, setPlans] = useState<LivePlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = () => setRefreshKey((k) => k + 1);

  const [editing, setEditing] = useState<LivePlan | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFeaturesRaw, setEditFeaturesRaw] = useState("");

  const [creating, setCreating] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [createFeaturesRaw, setCreateFeaturesRaw] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listLivePlans("SUPERADMIN")
      .then((res) => { if (!cancelled) setPlans(res); })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load plans.");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const openEdit = (plan: LivePlan) => {
    setEditing(plan);
    setEditFeaturesRaw(plan.features.join("\n"));
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing || isUpdating) return;
    setIsUpdating(true);
    const fd = new FormData(e.currentTarget);
    try {
      await updateLivePlan(editing.id, {
        name: String(fd.get("name") || ""),
        description: String(fd.get("description") || "") || undefined,
        validity: Number(fd.get("validity")),
        price: Number(fd.get("price")),
        originalPrice: fd.get("originalPrice") ? Number(fd.get("originalPrice")) : undefined,
        features: featuresFromString(editFeaturesRaw),
        recordingAccess: Number(fd.get("recordingAccess") || 0),
        batchRestricted: fd.get("batchRestricted") === "on",
        hidden: fd.get("hidden") === "on",
        isTrialPlan: fd.get("isTrialPlan") === "on",
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

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isCreatingPlan) return;
    setIsCreatingPlan(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createLivePlan({
        name: String(fd.get("name") || ""),
        description: String(fd.get("description") || "") || undefined,
        validity: Number(fd.get("validity")),
        price: Number(fd.get("price")),
        originalPrice: fd.get("originalPrice") ? Number(fd.get("originalPrice")) : undefined,
        features: featuresFromString(createFeaturesRaw),
        recordingAccess: Number(fd.get("recordingAccess") || 0),
        batchRestricted: fd.get("batchRestricted") === "on",
        hidden: fd.get("hidden") === "on",
        isTrialPlan: fd.get("isTrialPlan") === "on",
      });
      toast.success("Plan created");
      setCreating(false);
      setCreateFeaturesRaw("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create plan.");
    } finally {
      setIsCreatingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">Validity-based access plans for the entire live-class catalog</p>
        <Button onClick={() => setCreating(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {isLoading && plans.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      ) : plans.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No live plans found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              icon={<Zap className="w-6 h-6" style={{ color: PLAN_COLOR }} />}
              name={plan.name}
              price={Number(plan.price)}
              originalPrice={plan.originalPrice ? Number(plan.originalPrice) : null}
              validity={plan.validity}
              description={plan.description}
              features={plan.features}
              isActive={plan.isActive}
              badgeRow={
                <div className="flex flex-wrap gap-1">
                  {plan.isTrialPlan && (
                    <Badge className="text-xs bg-[#ff691d] text-white border-0">
                      Signup Trial Plan
                    </Badge>
                  )}
                  {plan.hidden && (
                    <Badge variant="secondary" className="text-xs">
                      Hidden from users
                    </Badge>
                  )}
                  {plan.batchRestricted && (
                    <Badge variant="secondary" className="text-xs">
                      Batch Restricted
                    </Badge>
                  )}
                  {plan.recordingAccess > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Recordings: {plan.recordingAccess}d
                    </Badge>
                  )}
                </div>
              }
              onEdit={() => openEdit(plan)}
            />
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
                <DialogDescription>Update live plan details</DialogDescription>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Original Price (₹)</Label>
                    <Input name="originalPrice" type="number" min={0} defaultValue={editing.originalPrice ? Number(editing.originalPrice) : ""} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Recording Access (days)</Label>
                    <Input name="recordingAccess" type="number" min={0} defaultValue={editing.recordingAccess} />
                  </div>
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
                  <div>
                    <Label className="font-normal">Batch Restricted</Label>
                    <p className="text-xs text-muted-foreground">Sādhakas must select a batch</p>
                  </div>
                  <input type="checkbox" name="batchRestricted" defaultChecked={editing.batchRestricted} className="sr-only peer" id="edit-live-batchRestricted" />
                  <label
                    htmlFor="edit-live-batchRestricted"
                    className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-muted peer-checked:bg-primary transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-normal">Hidden from users</Label>
                    <p className="text-xs text-muted-foreground">Excluded from the public pricing page</p>
                  </div>
                  <input type="checkbox" name="hidden" defaultChecked={editing.hidden} className="sr-only peer" id="edit-live-hidden" />
                  <label
                    htmlFor="edit-live-hidden"
                    className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-muted peer-checked:bg-primary transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-normal">Signup trial plan</Label>
                    <p className="text-xs text-muted-foreground">Auto-granted to every new signup for 14 days. Only one plan can be marked as this.</p>
                  </div>
                  <input type="checkbox" name="isTrialPlan" defaultChecked={editing.isTrialPlan} className="sr-only peer" id="edit-live-isTrialPlan" />
                  <label
                    htmlFor="edit-live-isTrialPlan"
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

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={(open) => { if (!open) { setCreating(false); setCreateFeaturesRaw(""); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Live Plan</DialogTitle>
              <DialogDescription>Add a new validity-based live-class plan</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input name="name" required maxLength={100} />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input name="description" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Validity (days)</Label>
                  <Input name="validity" type="number" min={1} required />
                </div>
                <div className="grid gap-2">
                  <Label>Price (₹)</Label>
                  <Input name="price" type="number" min={0} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Original Price (₹)</Label>
                  <Input name="originalPrice" type="number" min={0} />
                </div>
                <div className="grid gap-2">
                  <Label>Recording Access (days)</Label>
                  <Input name="recordingAccess" type="number" min={0} defaultValue={0} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Features <span className="text-muted-foreground text-xs">(one per line)</span></Label>
                <textarea
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={createFeaturesRaw}
                  onChange={(e) => setCreateFeaturesRaw(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-normal">Batch Restricted</Label>
                  <p className="text-xs text-muted-foreground">Sādhakas must select a batch</p>
                </div>
                <input type="checkbox" name="batchRestricted" defaultChecked className="sr-only peer" id="create-live-batchRestricted" />
                <label
                  htmlFor="create-live-batchRestricted"
                  className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-muted peer-checked:bg-primary transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-normal">Hidden from users</Label>
                  <p className="text-xs text-muted-foreground">Excluded from the public pricing page</p>
                </div>
                <input type="checkbox" name="hidden" className="sr-only peer" id="create-live-hidden" />
                <label
                  htmlFor="create-live-hidden"
                  className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-muted peer-checked:bg-primary transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-normal">Signup trial plan</Label>
                  <p className="text-xs text-muted-foreground">Auto-granted to every new signup for 14 days. Only one plan can be marked as this.</p>
                </div>
                <input type="checkbox" name="isTrialPlan" className="sr-only peer" id="create-live-isTrialPlan" />
                <label
                  htmlFor="create-live-isTrialPlan"
                  className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-muted peer-checked:bg-primary transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCreating(false); setCreateFeaturesRaw(""); }}>Cancel</Button>
              <Button type="submit" disabled={isCreatingPlan}>{isCreatingPlan ? "Creating..." : "Create Plan"}</Button>
            </DialogFooter>
          </form>
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

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Time-limited access plans for self-paced course content</p>

      {isLoading && plans.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      ) : plans.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No self-paced plans yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              icon={<Heart className="w-6 h-6" style={{ color: PLAN_COLOR }} />}
              name={plan.name}
              price={Number(plan.price)}
              originalPrice={plan.originalPrice ? Number(plan.originalPrice) : null}
              validity={plan.validity}
              description={plan.description}
              features={plan.features}
              isActive={plan.isActive}
              onEdit={() => openEdit(plan)}
            />
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
};

type FlatPlan = { plan: YTTPlan; course: YTTCourse };

function YTTPlansTab({ label, listCoursesFn, listPlansFn, updatePlanFn }: YTTPlansTabProps) {
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

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Manage {label} plans</p>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">Loading plans...</p>
      ) : flatPlans.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No {label} plans found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {flatPlans.map((fp) => (
            <PlanCard
              key={fp.plan.id}
              icon={<GraduationCap className="w-6 h-6" style={{ color: PLAN_COLOR }} />}
              name={fp.plan.name}
              price={Number(fp.plan.price)}
              originalPrice={fp.plan.originalPrice ? Number(fp.plan.originalPrice) : null}
              validity={fp.plan.validity}
              description={fp.plan.description}
              features={fp.plan.features}
              isActive={fp.plan.isActive}
              onEdit={() => openEdit(fp)}
            />
          ))}
        </div>
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
          <p className="text-muted-foreground mt-0.5">Manage live, self-paced and YTT access plans</p>
        </div>
      </div>

      <Tabs defaultValue="live">
        <TabsList className="mb-2">
          <TabsTrigger value="live" className="flex items-center gap-2">
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

        <TabsContent value="live">
          <LivePlansTab />
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
          />
        </TabsContent>

        <TabsContent value="ytt-live">
          <YTTPlansTab
            label="YTT Live"
            listCoursesFn={listYTTLiveCourses}
            listPlansFn={listYTTLivePlans}
            updatePlanFn={updateYTTLivePlan}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
