import { authedRequest } from "../lib/apiClient";
import { unwrap, type ApiSuccess, type Role } from "./types";

// `isUpgrade` is honored only for the four subscription domains. When set and
// the student holds an active enrollment in that domain, the backend credits
// the unused-time value of the current plan against the new plan's price.
type WithExtras<T> = T & { couponCode?: string; isUpgrade?: boolean };

export type InitiatePaymentInput =
  | WithExtras<{ type: "SELF_PACED"; planId: string }>
  | WithExtras<{ type: "LIVE"; planId: string; batchId?: string }>
  | WithExtras<{ type: "YTT_LIVE"; planId: string; courseId: string }>
  | WithExtras<{ type: "YTT_RECORDED"; planId: string; courseId: string }>
  | WithExtras<{ type: "EVENT"; entityId: string }>
  | WithExtras<{ type: "WORKSHOP"; entityId: string }>;

export type InitiatePaymentResponse = {
  // When a 100%-off coupon (or a flat discount ≥ the price) drops the charge
  // below Razorpay's ₹1 minimum, the backend skips the gateway entirely: it
  // fulfils the enrollment inline and returns `free: true` with NO orderId,
  // amount, currency, or key. The frontend MUST detect this and skip checkout —
  // passing the (undefined) key into Razorpay throws "No key passed".
  free?: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  key?: string;
  paymentRecordId: string;
  // GST breakup returned by the backend. baseAmount + gstAmount === the charged
  // amount (amountCharged, in rupees). For an upgrade, baseAmount already has
  // the unused-days credit subtracted.
  gstPercentage?: number;
  baseAmount?: number;
  gstAmount?: number;
  amountCharged?: number;
  originalAmount?: number;
  discountAmount?: number;
  isUpgrade?: boolean;
  // LIVE trial→paid only: unused trial days added on top of the new plan's
  // validity instead of being credited as a discount (the trial is free).
  bonusDays?: number;
};

export type VerifyPaymentInput = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export type PaymentRecord = {
  id: string;
  type: string;
  subtotal: string;
  status: "PAID" | "PENDING" | "FAILED";
  orderId: string;
  paymentId: string;
  selfPacedEnrollmentId: string | null;
  liveEnrollmentId: string | null;
  yttLiveEnrollmentId: string | null;
  yttRecordedEnrollmentId: string | null;
  workshopEnrollmentId: string | null;
  eventEnrollmentId: string | null;
  meta?: { isUpgrade?: boolean; bonusDays?: number } | null;
};

export function initiatePayment(role: Role, data: InitiatePaymentInput) {
  return unwrap<InitiatePaymentResponse>(
    authedRequest<ApiSuccess<InitiatePaymentResponse>>(role, {
      method: "POST",
      url: "/api/payments/initiate",
      data,
    }),
  );
}

export function verifyPayment(role: Role, data: VerifyPaymentInput) {
  return unwrap<PaymentRecord>(
    authedRequest<ApiSuccess<PaymentRecord>>(role, {
      method: "POST",
      url: "/api/payments/verify",
      data,
    }),
  );
}

// Refreshes a payment's status. If it's still PENDING, the backend checks
// directly with Razorpay (instead of waiting for the reconciliation cron) —
// use this when a checkout attempt's own verify call couldn't be trusted
// (dropped network after the Razorpay handler fired, or the checkout modal
// was dismissed but may have actually completed).
export function getPaymentStatus(role: Role, paymentRecordId: string) {
  return unwrap<PaymentRecord>(
    authedRequest<ApiSuccess<PaymentRecord>>(role, {
      method: "GET",
      url: `/api/payments/${paymentRecordId}/status`,
    }),
  );
}
