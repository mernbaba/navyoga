import { authedRequest } from "../lib/apiClient";
import { unwrap, type ApiSuccess, type Role } from "./types";

// Mirrors the backend `RenewalPrompt` (src/lib/renewalPrompt.ts). Attached to the
// per-page subscription/enrollment responses as `recentlyExpired`, and returned
// per-category by the roll-up endpoint below. `null` / `{ showRenew: false }`
// means "no renewal prompt" for that category.

export type RenewalPlan = {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  validity: number;
};

export type RenewalPrompt = {
  showRenew: true;
  /** ISO end date of the expired enrollment. */
  endedAt: string;
  /** Whole days since it ended (0 = ended today). */
  daysAgo: number;
  /** The plan the student had — prefill for the renew CTA. */
  plan: RenewalPlan;
  /** Present for the Live category (renew re-uses the same batch). */
  batchId?: string;
  /** Present for the two YTT categories. */
  courseId?: string;
  courseTitle?: string;
};

export type NoRenewal = { showRenew: false };

export type RenewalRollup = {
  live: RenewalPrompt | NoRenewal;
  selfPaced: RenewalPrompt | NoRenewal;
  yttLive: RenewalPrompt[];
  yttRecorded: RenewalPrompt[];
};

/** Narrows the roll-up's single-category slot to an actionable prompt, or null. */
export function asPrompt(slot: RenewalPrompt | NoRenewal | null | undefined): RenewalPrompt | null {
  return slot && slot.showRenew ? slot : null;
}

/**
 * GET /subscriptions/renewal-prompt — cross-category "recently expired — renew?"
 * roll-up for the logged-in student. Used by the dashboard and the YTT landing
 * pages (which read the plural enrollment lists and so can't get the flag inline).
 * Swallows errors into an empty roll-up so a missing/undeployed endpoint never
 * breaks the page.
 */
export async function getRenewalPrompt(role: Role = "STUDENT"): Promise<RenewalRollup> {
  try {
    return await unwrap<RenewalRollup>(
      authedRequest<ApiSuccess<RenewalRollup>>(role, {
        method: "GET",
        url: "/api/subscriptions/renewal-prompt",
      }),
    );
  } catch {
    return { live: { showRenew: false }, selfPaced: { showRenew: false }, yttLive: [], yttRecorded: [] };
  }
}
