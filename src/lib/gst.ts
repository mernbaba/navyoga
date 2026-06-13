import { useEffect, useState } from "react";
import { getPlatform } from "../api/platform";

// Listed/charged prices are GST-INCLUSIVE. The GST shown at checkout is the
// portion CONTAINED WITHIN that price at the SuperAdmin-configured rate — it is
// never added on top. This mirrors the backend split in coupon.service.ts:
//   base = inclusive / (1 + rate/100)
//   gst  = inclusive - base
// Keeping these helpers pure (rate passed in) makes them trivial to test and
// lets the hook own the single network read.

const round2 = (n: number) => Math.round(n * 100) / 100;

export type GstBreakup = {
  /** Pre-tax base contained in the inclusive amount. */
  baseAmount: number;
  /** GST portion contained in the inclusive amount. */
  gstAmount: number;
  /** Echoed inclusive amount — this is what the customer actually pays. */
  total: number;
};

/**
 * Split a GST-inclusive amount into base + GST at the given percentage.
 * gstAmount is derived as the remainder so base + gst === total exactly.
 */
export function computeGstBreakup(gstInclusiveAmount: number, gstPercentage: number): GstBreakup {
  const total = round2(gstInclusiveAmount);
  if (gstPercentage <= 0) {
    return { baseAmount: total, gstAmount: 0, total };
  }
  const baseAmount = round2(gstInclusiveAmount / (1 + gstPercentage / 100));
  return { baseAmount, gstAmount: round2(total - baseAmount), total };
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
