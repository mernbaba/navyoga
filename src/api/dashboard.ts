import { authedRequest } from "../lib/apiClient";
import { unwrap, type ApiSuccess, type Role } from "./types";

export type DashboardCardValue = {
  total: number;
  diff: number;
};

export type SuperadminDashboard = {
  cards: {
    students: DashboardCardValue;
    tutors: DashboardCardValue;
    classes: DashboardCardValue;
    revenue: DashboardCardValue;
  };
  revenue: Array<{ month: string; revenue: number }>;
  popularity: Array<{ name: string; students: number }>;
  membership: Array<{ name: string; value: number }>;
  performance: {
    rating: number;
    capacity: number;
    attendance: number;
  };
  marketing: Record<string, unknown>;
  referral: Record<string, unknown>;
  activity: unknown[];
  stats: unknown[];
};

export function getSuperadminDashboard(role: Role) {
  return unwrap<SuperadminDashboard>(
    authedRequest<ApiSuccess<SuperadminDashboard>>(role, {
      method: "GET",
      url: "/api/dashboard/superadmin",
    }),
  );
}
