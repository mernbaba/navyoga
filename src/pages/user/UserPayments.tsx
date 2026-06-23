import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Check, Crown, Zap, Shield, Calendar, GraduationCap, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useRazorpay } from "react-razorpay";
import {
  listLivePlans,
  listSelfPacedPlans,
  listAllYTTRecordedPlans,
  listAllYTTLivePlans,
  getMyLiveEnrollment,
} from "../../api/plans";
import { getMySelfPacedSubscription } from "../../api/selfPaced";
import { listMyYTTLiveEnrollments } from "../../api/yttLive";
import { listMyYTTRecordedEnrollments } from "../../api/yttRecorded";
import { initiatePayment, verifyPayment } from "../../api/payments";
import type { InitiatePaymentInput } from "../../api/payments";
import { listBatches } from "../../api/batches";
import type { LivePlan, SelfPacedPlan, YTTPlan, Batch } from "../../api/types";
import { CouponInput, type CouponApplied } from "../../components/CouponInput";
import type { CouponValidateBody } from "../../api/coupons";
import { computeGstAddOn, useGstPercentage } from "../../lib/gst";

type PlanCategory = "live" | "self-paced" | "ytt-recorded" | "ytt-live";

type UiPlan = {
  id: string;
  name: string;
  duration: string;
  validity: number; // raw plan validity in days - used for upgrade proration
  price: number;
  originalPrice?: number;
  monthlyPrice?: number;
  popular: boolean;
  badge?: string;
  features: string[];
  color: string;
  category: PlanCategory;
  // Set for YTT plans where enrollment is per-course.
  courseId?: string;
};

const COLOR_DEFAULT = "#ff691d";

const formatINR = (val: number) =>
  val.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

const formatValidity = (days: number) => {
  if (days <= 31) return "month";
  if (days <= 95) return "3 months";
  if (days <= 190) return "6 months";
  if (days <= 380) return "12 months";
  return `${days} days`;
};

const toNumber = (v: string | number): number => (typeof v === "number" ? v : Number(v));

const optionalNumber = (v: string | number | null | undefined): number | undefined =>
  v === null || v === undefined || v === "" ? undefined : toNumber(v);

const livePlanToUi = (p: LivePlan): UiPlan => ({
  id: p.id,
  name: p.name,
  duration: formatValidity(p.validity),
  validity: p.validity,
  price: toNumber(p.price),
  originalPrice: optionalNumber(p.originalPrice),
  popular: false,
  features: p.features,
  color: COLOR_DEFAULT,
  category: "live",
});

const selfPacedToUi = (p: SelfPacedPlan): UiPlan => ({
  id: p.id,
  name: p.name,
  duration: formatValidity(p.validity),
  validity: p.validity,
  price: toNumber(p.price),
  originalPrice: optionalNumber(p.originalPrice),
  popular: false,
  features: p.features,
  color: COLOR_DEFAULT,
  category: "self-paced",
});

const yttRecordedToUi = (plan: YTTPlan): UiPlan => ({
  id: plan.id,
  name: plan.name,
  duration: formatValidity(plan.validity),
  validity: plan.validity,
  price: toNumber(plan.price),
  originalPrice: optionalNumber(plan.originalPrice),
  popular: false,
  features: plan.features,
  color: COLOR_DEFAULT,
  category: "ytt-recorded",
  courseId: plan.courseId,
});

const yttLiveToUi = (plan: YTTPlan): UiPlan => ({
  id: plan.id,
  name: plan.name,
  duration: formatValidity(plan.validity),
  validity: plan.validity,
  price: toNumber(plan.price),
  originalPrice: optionalNumber(plan.originalPrice),
  popular: false,
  features: plan.features,
  color: COLOR_DEFAULT,
  category: "ytt-live",
  courseId: plan.courseId,
});

type TabValue = "live" | "selfpaced" | "ytt";
const VALID_TABS: TabValue[] = ["live", "selfpaced", "ytt"];
const isValidTab = (v: string | null): v is TabValue =>
  v !== null && (VALID_TABS as string[]).includes(v);

export function UserPayments() {
  const { gstPercentage } = useGstPercentage();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const activeTab: TabValue = isValidTab(tabFromUrl) ? tabFromUrl : "live";

  const setActiveTab = (next: string) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("tab", next);
        return sp;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    if (!isValidTab(tabFromUrl)) {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("tab", "live");
          return sp;
        },
        { replace: true },
      );
    }
  }, [tabFromUrl, setSearchParams]);

  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<UiPlan | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [livePlans, setLivePlans] = useState<UiPlan[]>([]);
  const [selfPacedPlans, setSelfPacedPlans] = useState<UiPlan[]>([]);
  const [yttSelfPacedPlans, setYttSelfPacedPlans] = useState<UiPlan[]>([]);
  const [yttLivePlans, setYttLivePlans] = useState<UiPlan[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [activeLivePlanId, setActiveLivePlanId] = useState<string | null>(null);
  const [activeSelfPacedPlanId, setActiveSelfPacedPlanId] = useState<string | null>(null);
  const [activeYttLiveKeys, setActiveYttLiveKeys] = useState<Set<string>>(new Set());
  const [activeYttRecordedKeys, setActiveYttRecordedKeys] = useState<Set<string>>(new Set());
  // Expiry (ISO) of the active enrollment per category, keyed for upgrade
  // proration. Live/self-paced have one active plan → key is the category;
  // YTT is per-course → key is `${planId}:${courseId}`, matching the *Keys sets.
  const [activeExpiry, setActiveExpiry] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    setIsLoadingPlans(true);
    (async () => {
      try {
        const [live, selfPaced, yttRecorded, yttLive] = await Promise.all([
          listLivePlans("STUDENT"),
          listSelfPacedPlans("STUDENT"),
          listAllYTTRecordedPlans("STUDENT"),
          listAllYTTLivePlans("STUDENT"),
        ]);
        if (cancelled) return;

        setLivePlans(live.filter((p) => p.isActive).map(livePlanToUi));
        setSelfPacedPlans(selfPaced.filter((p) => p.isActive).map(selfPacedToUi));
        setYttSelfPacedPlans(yttRecorded.filter((p) => p.isActive).map(yttRecordedToUi));
        setYttLivePlans(yttLive.filter((p) => p.isActive).map(yttLiveToUi));
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load plans.");
        }
      } finally {
        if (!cancelled) setIsLoadingPlans(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const [liveData, selfPacedData, yttLiveData, yttRecordedData] = await Promise.all([
        getMyLiveEnrollment(),
        getMySelfPacedSubscription(),
        listMyYTTLiveEnrollments(),
        listMyYTTRecordedEnrollments(),
      ]);
      setActiveLivePlanId(liveData.enrollment?.planId ?? null);
      setActiveSelfPacedPlanId(selfPacedData.subscription?.planId ?? null);
      setActiveYttLiveKeys(new Set(yttLiveData.map((e) => `${e.planId}:${e.courseId}`)));
      setActiveYttRecordedKeys(new Set(yttRecordedData.map((e) => `${e.planId}:${e.courseId}`)));

      const expiry: Record<string, string> = {};
      if (liveData.enrollment) expiry["live"] = liveData.enrollment.endDate;
      if (selfPacedData.subscription) expiry["self-paced"] = selfPacedData.subscription.expiresAt;
      for (const e of yttLiveData) expiry[`${e.planId}:${e.courseId}`] = e.expiresAt;
      for (const e of yttRecordedData) expiry[`${e.planId}:${e.courseId}`] = e.expiresAt;
      setActiveExpiry(expiry);
    } catch {
      // silently ignore - plan cards render without subscription highlights
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

const isSubscribed = (plan: UiPlan): boolean => {
    switch (plan.category) {
      case "live": return activeLivePlanId === plan.id;
      case "self-paced": return activeSelfPacedPlanId === plan.id;
      case "ytt-live": return activeYttLiveKeys.has(`${plan.id}:${plan.courseId ?? ""}`);
      case "ytt-recorded": return activeYttRecordedKeys.has(`${plan.id}:${plan.courseId ?? ""}`);
    }
  };

  const isCategoryLocked = (category: PlanCategory): boolean => {
    switch (category) {
      case "live": return activeLivePlanId !== null;
      case "self-paced": return activeSelfPacedPlanId !== null;
      case "ytt-live": return activeYttLiveKeys.size > 0;
      case "ytt-recorded": return activeYttRecordedKeys.size > 0;
    }
  };

  const plansForCategory = (category: PlanCategory): UiPlan[] => {
    switch (category) {
      case "live": return livePlans;
      case "self-paced": return selfPacedPlans;
      case "ytt-live": return yttLivePlans;
      case "ytt-recorded": return yttSelfPacedPlans;
    }
  };

  // The student's current active plan in the same category (and course, for
  // YTT) as `plan` - the one being replaced on an upgrade. Returns the matching
  // UiPlan (for old price + validity) and its enrollment expiry, or null when
  // the category isn't locked. For YTT, only an enrollment on the *same course*
  // counts (a different course is a fresh purchase, not an upgrade).
  const currentActiveFor = (plan: UiPlan): { plan: UiPlan; expiresAt: string } | null => {
    const list = plansForCategory(plan.category);
    if (plan.category === "live") {
      if (!activeLivePlanId) return null;
      const cur = list.find((p) => p.id === activeLivePlanId);
      const expiresAt = activeExpiry["live"];
      return cur && expiresAt ? { plan: cur, expiresAt } : null;
    }
    if (plan.category === "self-paced") {
      if (!activeSelfPacedPlanId) return null;
      const cur = list.find((p) => p.id === activeSelfPacedPlanId);
      const expiresAt = activeExpiry["self-paced"];
      return cur && expiresAt ? { plan: cur, expiresAt } : null;
    }
    // YTT: find the active key for THIS card's course.
    const keys = plan.category === "ytt-live" ? activeYttLiveKeys : activeYttRecordedKeys;
    const match = [...keys].find((k) => k.endsWith(`:${plan.courseId ?? ""}`));
    if (!match) return null;
    const activePlanId = match.split(":")[0];
    const cur = list.find((p) => p.id === activePlanId && p.courseId === plan.courseId);
    const expiresAt = activeExpiry[match];
    return cur && expiresAt ? { plan: cur, expiresAt } : null;
  };

  // An upgrade is a locked category + a card that is NOT the current plan, with
  // a resolvable current plan in the same course.
  const isUpgradeTarget = (plan: UiPlan): boolean =>
    isCategoryLocked(plan.category) && !isSubscribed(plan) && currentActiveFor(plan) !== null;

  // Rupee credit for the unused time on the current plan, prorated over its
  // validity - mirrors the backend computeUpgradeBase. remainingDays uses ceil
  // and is clamped to [0, oldValidity].
  const upgradeCreditFor = (plan: UiPlan): number => {
    const current = currentActiveFor(plan);
    if (!current || current.plan.validity <= 0) return 0;
    const msPerDay = 24 * 60 * 60 * 1000;
    const remainingMs = new Date(current.expiresAt).getTime() - Date.now();
    const rawDays = Math.ceil(remainingMs / msPerDay);
    const remainingDays = Math.min(Math.max(rawDays, 0), current.plan.validity);
    const credit = (remainingDays / current.plan.validity) * current.plan.price;
    return Math.round(credit * 100) / 100;
  };

const [isEnrolling, setIsEnrolling] = useState(false);
  const { Razorpay } = useRazorpay();
  const [appliedCoupon, setAppliedCoupon] = useState<CouponApplied | null>(null);

  // Shared CTA renderer for a plan card. Three states:
  //  - current plan        → non-interactive "Your Current Plan" block
  //  - locked + upgradeable → enabled "Upgrade to this plan"
  //  - locked, not upgradeable (e.g. data still loading) → disabled
  //  - unlocked            → the domain's normal buy label
  // `bg` builds the enabled background (flat colour or gradient per domain).
  const renderPlanCta = (
    plan: UiPlan,
    buyLabel: string,
    bg: (color: string) => string,
    extraClass = "",
  ) => {
    if (isSubscribed(plan)) {
      return (
        <div className="w-full py-4 text-base font-semibold rounded-xl flex items-center justify-center gap-2 bg-green-50 text-green-700 border-2 border-green-500">
          <Check className="w-5 h-5" />
          Your Current Plan
        </div>
      );
    }
    const locked = isCategoryLocked(plan.category);
    const upgrade = isUpgradeTarget(plan);
    const disabled = locked && !upgrade;
    const label = upgrade ? "Upgrade to this plan" : disabled ? "Active on another plan" : buyLabel;
    return (
      <Button
        className={`w-full py-6 text-base font-semibold rounded-xl ${extraClass}`}
        style={{ background: disabled ? "#9ca3af" : bg(plan.color), color: "white" }}
        onClick={() => handleUpgrade(plan)}
        disabled={disabled}
      >
        {upgrade && <Crown className="w-5 h-5 mr-2" />}
        {label}
      </Button>
    );
  };

  const handleUpgrade = (plan: UiPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeDialog(true);
    setAppliedCoupon(null);

    if (plan.category === "live") {
      setSelectedBatchId("");
      setIsLoadingBatches(true);
      listBatches("STUDENT", { limit: 50 })
        .then((page) => {
          setBatches(page.items);
          if (page.items.length > 0) setSelectedBatchId(page.items[0].id);
        })
        .catch(() => {
          toast.error("Failed to load batches.");
        })
        .finally(() => setIsLoadingBatches(false));
    }
  };

  // Build the coupon validation context for the selected plan, or null if the
  // required product fields aren't ready yet (e.g. LIVE without a chosen batch).
  const couponContext: Omit<CouponValidateBody, "code"> | null = (() => {
    if (!selectedPlan) return null;
    // Preview the coupon against the upgrade base when this is an upgrade, so
    // the displayed discount matches the eventual charge.
    const isUpgrade = isUpgradeTarget(selectedPlan) || undefined;
    switch (selectedPlan.category) {
      case "live":
        if (!selectedBatchId) return null;
        return { type: "LIVE", planId: selectedPlan.id, batchId: selectedBatchId, isUpgrade };
      case "self-paced":
        return { type: "SELF_PACED", planId: selectedPlan.id, isUpgrade };
      case "ytt-live":
        if (!selectedPlan.courseId) return null;
        return { type: "YTT_LIVE", planId: selectedPlan.id, courseId: selectedPlan.courseId, isUpgrade };
      case "ytt-recorded":
        if (!selectedPlan.courseId) return null;
        return { type: "YTT_RECORDED", planId: selectedPlan.id, courseId: selectedPlan.courseId, isUpgrade };
    }
  })();

  // Clear an applied coupon if the batch selection changes (LIVE only) - the
  // validated price is tied to the previous context.
  useEffect(() => {
    if (selectedPlan?.category === "live" && appliedCoupon) {
      setAppliedCoupon(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatchId]);

  const handleConfirmPay = async () => {
    if (!selectedPlan) return;

    if (
      (selectedPlan.category === "ytt-live" || selectedPlan.category === "ytt-recorded") &&
      !selectedPlan.courseId
    ) {
      toast.error("This plan is not linked to a course.");
      return;
    }

    const upgrading = isUpgradeTarget(selectedPlan);
    setIsEnrolling(true);
    setShowUpgradeDialog(false);

    try {
      const couponCode = appliedCoupon?.code;
      const isUpgrade = upgrading || undefined; // omit the field for fresh purchases
      const paymentInput: InitiatePaymentInput = (() => {
        switch (selectedPlan.category) {
          case "live":
            return { type: "LIVE", planId: selectedPlan.id, batchId: selectedBatchId || undefined, couponCode, isUpgrade };
          case "self-paced":
            return { type: "SELF_PACED", planId: selectedPlan.id, couponCode, isUpgrade };
          case "ytt-live":
            return { type: "YTT_LIVE", planId: selectedPlan.id, courseId: selectedPlan.courseId!, couponCode, isUpgrade };
          case "ytt-recorded":
            return { type: "YTT_RECORDED", planId: selectedPlan.id, courseId: selectedPlan.courseId!, couponCode, isUpgrade };
        }
      })();

      const paymentData = await initiatePayment("STUDENT", paymentInput);

      // Free order: a 100%-off coupon dropped the charge below Razorpay's ₹1
      // minimum, so the backend already fulfilled the enrollment and returned no
      // gateway key/order. Opening Razorpay here would throw "No key passed".
      // Skip checkout and treat it as an immediate success.
      if (paymentData.free) {
        toast.success(
          upgrading
            ? `Successfully upgraded to ${selectedPlan.name}!`
            : `Successfully subscribed to ${selectedPlan.name}!`,
        );
        setAppliedCoupon(null);
        void fetchSubscriptions();
        return;
      }

      document.body.style.overflow = "hidden";
      try {
        await new Promise<void>((resolve, reject) => {
          const rzp = new Razorpay({
            key: paymentData.key,
            amount: paymentData.amount,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currency: paymentData.currency as any,
            order_id: paymentData.orderId,
            name: "Navyoga",
            description: selectedPlan.name,
            handler: async (response) => {
              try {
                await verifyPayment("STUDENT", {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                toast.success(
                  upgrading
                    ? `Successfully upgraded to ${selectedPlan.name}!`
                    : `Successfully subscribed to ${selectedPlan.name}!`,
                );
                setAppliedCoupon(null);
                void fetchSubscriptions();
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            modal: {
              ondismiss: () => reject(new Error("__dismissed__")),
            },
          });
          rzp.open();
        });
      } finally {
        document.body.style.overflow = "";
      }
    } catch (err) {
      if (err instanceof Error && err.message === "__dismissed__") {
        toast.info("Payment cancelled.");
      } else {
        toast.error(err instanceof Error ? err.message : "Payment failed. Please try again.");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
 
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl mb-8 p-8 md:p-12"
        style={{
          background: 'linear-gradient(135deg, #ff691d 0%, #610981 100%)'
        }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Subscription Plans
            </h1>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-white/90 text-lg max-w-2xl"
          >
            Choose the perfect plan for your yoga journey. From live interactive classes to self-paced programs and professional teacher training.
          </motion.p>
 
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid p-1 h-auto bg-gray-100 rounded-2xl">
          <TabsTrigger
            value="live"
            className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md"
          >
            <Zap className="w-4 h-4 mr-2" />
            Live Classes
          </TabsTrigger>
          <TabsTrigger
            value="selfpaced"
            className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md"
          >
            <Heart className="w-4 h-4 mr-2" />
            Self-Paced
          </TabsTrigger>
          <TabsTrigger
            value="ytt"
            className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Teacher Training
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>
                  Live Yoga Classes
                </h2>
                <p className="text-muted-foreground mt-1" style={{ color: '#ffac96' }}>
                  Pick a validity that fits your practice
                </p>
              </div>
            </div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            >
              {livePlans.map((plan) => (
                <motion.div key={plan.id} variants={item}>
                  <Card
                    className="relative overflow-hidden transition-all hover:shadow-2xl hover:scale-105 border-2 h-full group"
                    style={isSubscribed(plan) ? { borderColor: '#16a34a' } : plan.popular ? { borderColor: plan.color } : {}}
                  >
                    {isSubscribed(plan) && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-green-500 text-white border-0">Active Plan</Badge>
                      </div>
                    )}
                    {!isSubscribed(plan) && plan.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge style={{ backgroundColor: plan.color, color: 'white' }}>
                          {plan.badge}
                        </Badge>
                      </div>
                    )}
                    {!isSubscribed(plan) && plan.popular && !plan.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge style={{ backgroundColor: plan.color, color: 'white' }}>
                          Popular
                        </Badge>
                      </div>
                    )}
 
                    <div 
                      className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ backgroundColor: plan.color }}
                    />
                    
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl" style={{ backgroundColor: `${plan.color}20` }}>
                          <Zap className="w-6 h-6" style={{ color: plan.color }} />
                        </div>
                        <CardTitle className="text-2xl" style={{ color: plan.color }}>
                          {plan.name}
                        </CardTitle>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-5xl font-bold">₹{plan.price}</span>
                          {plan.originalPrice && plan.originalPrice > plan.price && (
                            <span className="text-base text-muted-foreground line-through">
                              ₹{plan.originalPrice}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">+ GST</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          for {plan.duration}
                        </p>
                        {plan.monthlyPrice && (
                          <p className="text-xs text-muted-foreground mt-1">
                            (₹{plan.monthlyPrice}/month)
                          </p>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Check className="w-5 h-5 shrink-0" style={{ color: plan.color }} />
                            </div>
                            <span className="text-sm leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {renderPlanCta(plan, "Get Started", (c) => c)}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>

        </TabsContent>

        <TabsContent value="selfpaced" className="space-y-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>
                Self-Paced Yoga Programs
              </h2>
              <p className="text-muted-foreground mt-1" style={{ color: '#ffac96' }}>
                Learn at your own pace with recorded sessions and lifetime access
              </p>
            </div>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {selfPacedPlans.map((plan) => (
              <motion.div key={plan.id} variants={item}>
                <Card
                  className="relative overflow-hidden transition-all hover:shadow-2xl hover:scale-105 border h-full group"
                  style={isSubscribed(plan) ? { borderColor: '#16a34a', borderWidth: '2px' } : plan.popular ? { borderColor: plan.color, borderWidth: '2px' } : {}}
                >
                  {isSubscribed(plan) && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-green-500 text-white border-0">Active Plan</Badge>
                    </div>
                  )}
                  {!isSubscribed(plan) && plan.badge && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge style={{ backgroundColor: plan.color, color: 'white' }}>
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  {!isSubscribed(plan) && plan.popular && !plan.badge && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge style={{ backgroundColor: plan.color, color: 'white' }}>
                        Popular
                      </Badge>
                    </div>
                  )}
                  
                  <div 
                    className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                    style={{ backgroundColor: plan.color }}
                  />
                  
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-2xl" style={{ backgroundColor: `${plan.color}20` }}>
                        <Heart className="w-6 h-6" style={{ color: plan.color }} />
                      </div>
                      <CardTitle className="text-2xl" style={{ color: plan.color }}>
                        {plan.name}
                      </CardTitle>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-5xl font-bold">₹{plan.price}</span>
                        {plan.originalPrice && plan.originalPrice > plan.price && (
                          <span className="text-base text-muted-foreground line-through">
                            ₹{plan.originalPrice}
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">+ GST</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        for {plan.duration}
                      </p>
                      {plan.monthlyPrice && (
                        <p className="text-xs text-muted-foreground mt-1">
                          (₹{plan.monthlyPrice}/month)
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <Check className="w-5 h-5 shrink-0" style={{ color: plan.color }} />
                          </div>
                          <span className="text-sm leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    {renderPlanCta(plan, "Get Started", (c) => c)}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="ytt" className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>
                  Yoga Teacher Training - Self-Paced
                </h2>
                <p className="text-muted-foreground mt-1" style={{ color: '#ffac96' }}>
                  Become a certified yoga instructor at your own pace
                </p>
              </div>
            </div>

            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-3"
            >
              {yttSelfPacedPlans.map((plan) => (
                <motion.div key={plan.id} variants={item}>
                  <Card
                    className="relative overflow-hidden transition-all hover:shadow-2xl hover:scale-105 border h-full group"
                    style={isSubscribed(plan) ? { borderColor: '#16a34a', borderWidth: '2px' } : plan.badge ? { borderColor: plan.color, borderWidth: '2px' } : {}}
                  >
                    {isSubscribed(plan) && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-green-500 text-white border-0">Active Plan</Badge>
                      </div>
                    )}
                    {!isSubscribed(plan) && plan.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge style={{ backgroundColor: plan.color, color: 'white' }}>
                          {plan.badge}
                        </Badge>
                      </div>
                    )}
                    {!isSubscribed(plan) && plan.popular && !plan.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge style={{ backgroundColor: plan.color, color: 'white' }}>
                          Popular
                        </Badge>
                      </div>
                    )}
                    
                    <div 
                      className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ backgroundColor: plan.color }}
                    />
                    
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl" style={{ backgroundColor: `${plan.color}20` }}>
                          <GraduationCap className="w-6 h-6" style={{ color: plan.color }} />
                        </div>
                        <CardTitle className="text-2xl" style={{ color: plan.color }}>
                          {plan.name}
                        </CardTitle>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-5xl font-bold">₹{plan.price}</span>
                          {plan.originalPrice && plan.originalPrice > plan.price && (
                            <span className="text-base text-muted-foreground line-through">
                              ₹{plan.originalPrice}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">+ GST</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.duration}
                        </p>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Check className="w-5 h-5 shrink-0" style={{ color: plan.color }} />
                            </div>
                            <span className="text-sm leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      {renderPlanCta(plan, "Enroll Now", (c) => c)}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="pt-8 border-t">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>
                  Yoga Teacher Training - Live Sessions
                </h2>
                <p className="text-muted-foreground mt-1" style={{ color: '#ffac96' }}>
                  Interactive live training with expert instructors and personal mentorship
                </p>
              </div>
            </div>

            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-3"
            >
              {yttLivePlans.map((plan) => (
                <motion.div key={plan.id} variants={item}>
                  <Card
                    className="relative overflow-hidden transition-all hover:shadow-2xl hover:scale-105 border-2 h-full group"
                    style={{ borderColor: isSubscribed(plan) ? '#16a34a' : plan.color }}
                  >
                    {isSubscribed(plan) && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-green-500 text-white border-0">Active Plan</Badge>
                      </div>
                    )}
                    {!isSubscribed(plan) && plan.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-linear-to-r from-orange-500 to-purple-600 text-white border-0">
                          {plan.badge}
                        </Badge>
                      </div>
                    )}
                    {!isSubscribed(plan) && plan.popular && !plan.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge style={{ backgroundColor: plan.color, color: 'white' }}>
                          Popular
                        </Badge>
                      </div>
                    )}
                    
                    <div 
                      className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ backgroundColor: plan.color }}
                    />
                    
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-linear-to-br" style={{ background: `linear-gradient(135deg, ${plan.color}40, ${plan.color}20)` }}>
                          <GraduationCap className="w-6 h-6" style={{ color: plan.color }} />
                        </div>
                        <CardTitle className="text-2xl" style={{ color: plan.color }}>
                          {plan.name}
                        </CardTitle>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-5xl font-bold">₹{plan.price}</span>
                          {plan.originalPrice && plan.originalPrice > plan.price && (
                            <span className="text-base text-muted-foreground line-through">
                              ₹{plan.originalPrice}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">+ GST</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.duration}
                        </p>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Check className="w-5 h-5 shrink-0" style={{ color: plan.color }} />
                            </div>
                            <span className="text-sm leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      {renderPlanCta(
                        plan,
                        "Enroll Now",
                        (c) => `linear-gradient(135deg, ${c}, ${c}dd)`,
                        "shadow-lg",
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
 
      <Dialog
        open={showUpgradeDialog}
        onOpenChange={(open) => {
          setShowUpgradeDialog(open);
          if (!open) setAppliedCoupon(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>
              {selectedPlan && isUpgradeTarget(selectedPlan)
                ? `Upgrade to ${selectedPlan.name}`
                : `Subscribe to ${selectedPlan?.name}`}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan && isUpgradeTarget(selectedPlan)
                ? "Your current plan's unused days are credited towards this upgrade."
                : "Review your plan details and confirm your subscription"}
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (() => {
            // Listed prices are GST-exclusive base values. On an upgrade the
            // unused-time credit is subtracted from the base first; then the
            // coupon discounts the remaining base; then GST is added on top -
            // matching the backend's charged amount.
            const upgrading = isUpgradeTarget(selectedPlan);
            const credit = upgrading ? upgradeCreditFor(selectedPlan) : 0;
            const afterCredit = Math.max(0, selectedPlan.price - credit);
            const discountedBase = appliedCoupon
              ? Math.max(0, afterCredit - appliedCoupon.discountAmount)
              : afterCredit;
            const breakup = computeGstAddOn(discountedBase, gstPercentage);
            return (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border-2" style={{ borderColor: selectedPlan.color }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{selectedPlan.name} Plan</h4>
                  <Badge style={{ backgroundColor: `${selectedPlan.color}20`, color: selectedPlan.color }}>
                    {selectedPlan.duration}
                  </Badge>
                </div>
                <div className="space-y-1.5 mb-4 pb-3 border-b">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Plan price</span>
                    <span className="flex items-baseline gap-2">
                      {selectedPlan.originalPrice && selectedPlan.originalPrice > selectedPlan.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{formatINR(selectedPlan.originalPrice)}
                        </span>
                      )}
                      <span>₹{formatINR(selectedPlan.price)}</span>
                    </span>
                  </div>
                  {upgrading && credit > 0 && (
                    <div className="flex items-center justify-between text-sm text-green-700">
                      <span>Credit for unused days</span>
                      <span>− ₹{formatINR(credit)}</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-sm text-green-700">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span>− ₹{formatINR(appliedCoupon.discountAmount)}</span>
                    </div>
                  )}
                  {gstPercentage > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Taxable value</span>
                        <span>₹{formatINR(breakup.baseAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          GST ({formatINR(gstPercentage)}%)
                        </span>
                        <span>+ ₹{formatINR(breakup.gstAmount)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-baseline justify-between pt-1.5">
                    <span className="font-semibold">Total payable</span>
                    <span className="text-3xl font-bold" style={{ color: selectedPlan.color }}>
                      ₹{formatINR(breakup.total)}
                    </span>
                  </div>
                  {selectedPlan.monthlyPrice && (
                    <p className="text-xs text-muted-foreground text-right">
                      (₹{selectedPlan.monthlyPrice}/month)
                    </p>
                  )}
                </div>
              </div>

              {selectedPlan.category === "live" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Batch</label>
                  {isLoadingBatches ? (
                    <p className="text-sm text-muted-foreground">Loading batches…</p>
                  ) : batches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No batches available.</p>
                  ) : (
                    <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {couponContext && (
                <CouponInput
                  context={couponContext}
                  applied={appliedCoupon}
                  disabled={isEnrolling}
                  onApplied={setAppliedCoupon}
                  onCleared={() => setAppliedCoupon(null)}
                />
              )}
            </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)} disabled={isEnrolling}>
              Cancel
            </Button>
            <Button
              style={{ backgroundColor: selectedPlan?.color, color: 'white' }}
              onClick={handleConfirmPay}
              disabled={
                isEnrolling ||
                (selectedPlan?.category === "live" && (isLoadingBatches || !selectedBatchId))
              }
            >
              {isEnrolling ? "Processing…" : "Confirm & Pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
