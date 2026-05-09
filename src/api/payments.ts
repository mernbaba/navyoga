import { authedRequest } from "../lib/apiClient";
import { unwrap, type ApiSuccess, type Role } from "./types";

export type InitiatePaymentInput =
  | { type: "SELF_PACED"; planId: string }
  | { type: "LIVE"; planId: string; batchId?: string }
  | { type: "YTT_LIVE"; planId: string; courseId: string }
  | { type: "YTT_RECORDED"; planId: string; courseId: string }
  | { type: "EVENT"; entityId: string }
  | { type: "WORKSHOP"; entityId: string };

export type InitiatePaymentResponse = {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  paymentRecordId: string;
};

export type VerifyPaymentInput = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export type PaymentRecord = {
  id: string;
  type: string;
  amount: string;
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
