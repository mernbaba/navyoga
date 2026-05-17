import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { TicketPercent, Check, X, Loader2 } from "lucide-react";
import { validateCoupon, type CouponValidateBody, type CouponValidateResponse } from "../api/coupons";

export type CouponApplied = {
  code: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  description: string | null;
  discountType: CouponValidateResponse["discountType"];
  discountValue: number;
};

type Props = {
  context: Omit<CouponValidateBody, "code">;
  disabled?: boolean;
  applied: CouponApplied | null;
  onApplied: (coupon: CouponApplied) => void;
  onCleared: () => void;
};

export function CouponInput({ context, disabled, applied, onApplied, onCleared }: Props) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || isValidating) return;
    setError(null);
    setIsValidating(true);
    try {
      const res = await validateCoupon("STUDENT", { ...context, code: trimmed });
      onApplied({
        code: res.code,
        originalAmount: res.originalAmount,
        discountAmount: res.discountAmount,
        finalAmount: res.finalAmount,
        description: res.description,
        discountType: res.discountType,
        discountValue: res.discountValue,
      });
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply coupon");
    } finally {
      setIsValidating(false);
    }
  }

  function handleRemove() {
    onCleared();
    setError(null);
  }

  if (applied) {
    return (
      <div className="rounded-lg border-2 border-green-500 bg-green-50 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-green-500 shrink-0">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-green-900">{applied.code}</span>
                <Badge className="bg-green-600 text-white border-0 text-xs">
                  {applied.discountType === "PERCENTAGE"
                    ? `${applied.discountValue}% OFF`
                    : `₹${applied.discountValue} OFF`}
                </Badge>
              </div>
              {applied.description && (
                <p className="text-xs text-green-800 mt-0.5 truncate">{applied.description}</p>
              )}
              <p className="text-xs text-green-900 font-medium mt-1">
                You save ₹{applied.discountAmount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-green-900 hover:bg-green-100"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="Remove coupon"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TicketPercent className="w-4 h-4" style={{ color: "#610981" }} />
        <span>Have a coupon code?</span>
      </div>
      <form onSubmit={handleApply} className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ENTER CODE"
          disabled={disabled || isValidating}
          maxLength={50}
          className="uppercase"
          autoComplete="off"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={disabled || isValidating || code.trim().length === 0}
          style={{ borderColor: "#610981", color: "#610981" }}
        >
          {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
        </Button>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
