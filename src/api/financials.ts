import { authedRequest } from "../lib/apiClient";
import { unwrap, type ApiSuccess, type Paginated, type Role } from "./types";

export type PaymentType =
  | "LIVE"
  | "SELF_PACED"
  | "YTT_LIVE"
  | "YTT_RECORDED"
  | "EVENT"
  | "WORKSHOP";

export type PaymentStatus = "PAID" | "PENDING" | "FAILED";

export type FinancialsOverview = {
  revenue: number;
  subscriptions: number;
  avgRevenue: number;
  growth: number;
  monthlyData: Array<{ month: string; revenue: number; subscriptions: number }>;
  subscriptionBreakdown: Array<{ name: string; value: number; revenue: number }>;
  planDistribution: Array<{ name: string; value: number }>;
};

export type FinancialsPaymentStats = {
  revenue: number;
  revenueThisMonth: number;
  subscriptionPayments: number;
  oneTimePayments: number;
};

export type FinancialsPaymentStudent = {
  id: string;
  name: string;
  email: string;
  phone: string;
} | null;

export type FinancialsPayment = {
  id: string;
  student: FinancialsPaymentStudent;
  amount: number;
  date: string;
  type: PaymentType;
  method: string | null;
  status: PaymentStatus;
};

export type FinancialsPaymentListParams = {
  q?: string;
  type?: PaymentType;
  status?: PaymentStatus;
  page?: number;
  limit?: number;
};

export function getFinancialsOverview(role: Role) {
  return unwrap<FinancialsOverview>(
    authedRequest<ApiSuccess<FinancialsOverview>>(role, {
      method: "GET",
      url: "/api/financials/overview",
    }),
  );
}

export function getFinancialsPaymentStats(role: Role) {
  return unwrap<FinancialsPaymentStats>(
    authedRequest<ApiSuccess<FinancialsPaymentStats>>(role, {
      method: "GET",
      url: "/api/financials/payments/stats",
    }),
  );
}

export function listFinancialsPayments(
  role: Role,
  params: FinancialsPaymentListParams = {},
) {
  return unwrap<Paginated<FinancialsPayment>>(
    authedRequest<ApiSuccess<Paginated<FinancialsPayment>>>(role, {
      method: "GET",
      url: "/api/financials/payments",
      params,
    }),
  );
}
