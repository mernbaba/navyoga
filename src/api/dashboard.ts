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
    leads: DashboardCardValue;
    revenue: DashboardCardValue;
  };
  revenue: Array<{ month: string; revenue: number }>;
  popularity: Array<{ name: string; students: number }>;
  membership: Array<{ name: string; value: number }>;
  performance: {
    rating: number;
    capacity: number;
    attendance: number;
    referrals: number;
    eventsAndWorkshops: number;
    subscriptions: number;
  };
};

export type MarketingAnalytics = {
  stats: {
    totalUsers: number;
    activeUsers: number;
    countries: number;
    avgAge: number;
  };
  ageDistribution: Array<{ range: string; users: number }>;
  genderDistribution: Array<{ name: string; value: number; color: string }>;
  topCities: Array<{ name: string; users: number; percent: number; color: string }>;
  countryDistribution: Array<{ name: string; value: number; color: string }>;
  acquisitionMedium: Array<{ channel: string; users: number; color: string }>;
  userGrowth: Array<{ month: string; users: number }>;
  subscriptionPlans: Array<{ name: string; value: number; color: string }>;
  activityStatus: Array<{ label: string; value: number; percent: number; color: string }>;
  deviceUsage: Array<{ name: string; users: number; percent: number; color: string }>;
};

export type OperationsDashboard = {
  cards: {
    employees: DashboardCardValue;
    tutors: DashboardCardValue;
    frontline: DashboardCardValue;
    students: DashboardCardValue;
    recorded: DashboardCardValue;
  };
  team: {
    employees: number;
    tutors: number;
    frontline: number;
  };
  system: {
    coupons: number;
    notifications: number;
    classes: number;
    recorded: number;
  };
};

export function getSuperadminDashboard(role: Role) {
  return unwrap<SuperadminDashboard>(
    authedRequest<ApiSuccess<SuperadminDashboard>>(role, {
      method: "GET",
      url: "/api/dashboard/superadmin",
    }),
  );
}

export function getMarketingAnalytics(role: Role) {
  return unwrap<MarketingAnalytics>(
    authedRequest<ApiSuccess<MarketingAnalytics>>(role, {
      method: "GET",
      url: "/api/dashboard/marketing",
    }),
  );
}

export function getOperationsDashboard(role: Role) {
  return unwrap<OperationsDashboard>(
    authedRequest<ApiSuccess<OperationsDashboard>>(role, {
      method: "GET",
      url: "/api/dashboard/operations",
    }),
  );
}
