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
  orderId: string;
  amount: number;
  currency: string;
  key: string;
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
