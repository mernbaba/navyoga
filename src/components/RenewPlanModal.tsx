import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Clock } from "lucide-react";
import { useCheckout } from "../hooks/useCheckout";
import type { RenewalPrompt } from "../api/renewal";
import type { InitiatePaymentInput } from "../api/payments";

// The four subscription domains, mapped to their payment `type` and the tab the
// "Choose another plan" link lands on.
export type RenewCategory = "live" | "self-paced" | "ytt-live" | "ytt-recorded";

const CATEGORY_LABEL: Record<RenewCategory, string> = {
  live: "Yoga Live",
  "self-paced": "Self-Paced",
  "ytt-live": "YTT Live",
  "ytt-recorded": "YTT Recorded",
};

// Which tab UserPayments (/user/subscriptions) opens on for each category.
const CATEGORY_TAB: Record<RenewCategory, string> = {
  live: "live",
  "self-paced": "self-paced",
  "ytt-live": "ytt",
  "ytt-recorded": "ytt",
};

const formatINR = (val: number) =>
  val.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

function buildPaymentInput(
  category: RenewCategory,
  prompt: RenewalPrompt,
): InitiatePaymentInput | null {
  // Renewal is always a fresh purchase — never `isUpgrade` (that's for switching
  // plans while an active enrollment exists). GST is added by the backend.
  switch (category) {
    case "live":
      return { type: "LIVE", planId: prompt.plan.id, batchId: prompt.batchId };
    case "self-paced":
      return { type: "SELF_PACED", planId: prompt.plan.id };
    case "ytt-live":
      if (!prompt.courseId) return null;
      return { type: "YTT_LIVE", planId: prompt.plan.id, courseId: prompt.courseId };
    case "ytt-recorded":
      if (!prompt.courseId) return null;
      return { type: "YTT_RECORDED", planId: prompt.plan.id, courseId: prompt.courseId };
  }
}

function expiredLabel(daysAgo: number): string {
  if (daysAgo <= 0) return "expired today";
  if (daysAgo === 1) return "expired yesterday";
  return `expired ${daysAgo} days ago`;
}

export type RenewPlanModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: RenewCategory;
  prompt: RenewalPrompt;
  /** Called after a successful renew (paid or free) so the page can refresh. */
  onRenewed?: () => void;
};

export function RenewPlanModal({
  open,
  onOpenChange,
  category,
  prompt,
  onRenewed,
}: RenewPlanModalProps) {
  const navigate = useNavigate();
  const checkout = useCheckout();
  const [renewing, setRenewing] = useState(false);

  const what = prompt.courseTitle ?? prompt.plan.name;
  const categoryLabel = CATEGORY_LABEL[category];

  const handleRenew = async () => {
    const input = buildPaymentInput(category, prompt);
    if (!input) {
      toast.error("This plan is no longer available to renew. Please choose a plan.");
      navigate(`/user/subscriptions?tab=${CATEGORY_TAB[category]}`);
      return;
    }

    setRenewing(true);
    try {
      const outcome = await checkout(input, { description: prompt.plan.name });
      if (outcome.status === "dismissed") {
        toast.info("Payment cancelled.");
        return;
      }
      toast.success(`Successfully renewed ${prompt.plan.name}!`);
      onOpenChange(false);
      onRenewed?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Renewal failed. Please try again.");
    } finally {
      setRenewing(false);
    }
  };

  const handleChooseAnother = () => {
    onOpenChange(false);
    navigate(`/user/subscriptions?tab=${CATEGORY_TAB[category]}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle style={{ color: "#ff691d" }}>Renew your {categoryLabel} plan</DialogTitle>
          <DialogDescription>
            Your access to <span className="font-medium">{what}</span> {expiredLabel(prompt.daysAgo)}.
            Renew now to pick up right where you left off.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{prompt.plan.name}</p>
              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                <Clock className="h-3.5 w-3.5" />
                {prompt.plan.validity} days validity
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">₹{formatINR(prompt.plan.price)}</p>
              {prompt.plan.originalPrice != null &&
                prompt.plan.originalPrice > prompt.plan.price && (
                  <p className="text-muted-foreground text-sm line-through">
                    ₹{formatINR(prompt.plan.originalPrice)}
                  </p>
                )}
            </div>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">+ GST at checkout</p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleChooseAnother} disabled={renewing}>
            Choose another plan
          </Button>
          <Button onClick={handleRenew} disabled={renewing}>
            {renewing ? "Processing…" : `Renew ₹${formatINR(prompt.plan.price)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
