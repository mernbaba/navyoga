import { useEffect, useState } from "react";
import { getPlatform } from "../api/platform";

// Listed prices are GST-EXCLUSIVE base values. The GST shown at checkout is
// ADDED ON TOP at the SuperAdmin-configured rate. This mirrors the backend in
// coupon.service.ts (computeGstAddOn):
//   base  = price
//   gst   = price * (rate/100)
//   total = base + gst
// Keeping these helpers pure (rate passed in) makes them trivial to test and
// lets the hook own the single network read.

const round2 = (n: number) => Math.round(n * 100) / 100;

export type GstBreakup = {
  /** Pre-tax base — the listed price. */
  baseAmount: number;
  /** GST added on top of the base. */
  gstAmount: number;
  /** base + gst — what the customer actually pays. */
  total: number;
};

/**
 * Add GST on top of a GST-exclusive base amount at the given percentage.
 */
export function computeGstAddOn(baseAmount: number, gstPercentage: number): GstBreakup {
  const base = round2(baseAmount);
  if (gstPercentage <= 0) {
    return { baseAmount: base, gstAmount: 0, total: base };
  }
  const gstAmount = round2(base * (gstPercentage / 100));
  return { baseAmount: base, gstAmount, total: round2(base + gstAmount) };
}

/**
 * Reads the SuperAdmin-configured GST rate from `/api/platform` (a public
 * endpoint). Defaults to 0 until loaded or if settings are unavailable — a 0%
 * rate makes the whole price the base value, matching the backend default.
 */
export function useGstPercentage(): { gstPercentage: number; isLoading: boolean } {
  const [gstPercentage, setGstPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPlatform()
      .then((settings) => {
        if (cancelled) return;
        const rate = Number(settings.gstPercentage);
        setGstPercentage(Number.isFinite(rate) ? rate : 0);
      })
      .catch(() => {
        // best-effort — leave the 0% default in place
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { gstPercentage, isLoading };
}
