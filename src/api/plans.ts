import { authedRequest } from "../lib/apiClient";
import { unwrap, type ApiSuccess, type MembershipPeriod, type SubscriptionPlan, type SelfPacedPlan, type YTTCourse, type YTTPlan } from "./types";

// ─── SUBSCRIPTION PLANS ───────────────────────────────────────────────────────

export type SubscriptionPlanBody = {
  name: string;
  description?: string;
  period: MembershipPeriod;
  price: number;
  originalPrice?: number;
  features?: string[];
  canAccessLiveClasses?: boolean;
  canAccessRecordings?: boolean;
  isPopular?: boolean;
  isBestValue?: boolean;
  isInaugural?: boolean;
  isActive?: boolean;
};

export function listSubscriptionPlans() {
  return unwrap<SubscriptionPlan[]>(
    authedRequest<ApiSuccess<SubscriptionPlan[]>>("SUPERADMIN", {
      method: "GET",
      url: "/api/subscription-plans",
    }),
  );
}

export function createSubscriptionPlan(body: SubscriptionPlanBody) {
  return unwrap<SubscriptionPlan>(
    authedRequest<ApiSuccess<SubscriptionPlan>>("SUPERADMIN", {
      method: "POST",
      url: "/api/subscription-plans",
      data: body,
    }),
  );
}

export function updateSubscriptionPlan(id: string, body: Partial<SubscriptionPlanBody>) {
  return unwrap<SubscriptionPlan>(
    authedRequest<ApiSuccess<SubscriptionPlan>>("SUPERADMIN", {
      method: "PATCH",
      url: `/api/subscription-plans/${id}`,
      data: body,
    }),
  );
}

export function deleteSubscriptionPlan(id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>("SUPERADMIN", {
      method: "DELETE",
      url: `/api/subscription-plans/${id}`,
    }),
  );
}

// ─── SELF-PACED PLANS ─────────────────────────────────────────────────────────

export type SelfPacedPlanBody = {
  name: string;
  description?: string;
  validity: number;
  price: number;
  originalPrice?: number;
  features?: string[];
  isActive?: boolean;
};

export function listSelfPacedPlans() {
  return unwrap<SelfPacedPlan[]>(
    authedRequest<ApiSuccess<SelfPacedPlan[]>>("SUPERADMIN", {
      method: "GET",
      url: "/api/self-paced/plans",
    }),
  );
}

export function createSelfPacedPlan(body: SelfPacedPlanBody) {
  return unwrap<SelfPacedPlan>(
    authedRequest<ApiSuccess<SelfPacedPlan>>("SUPERADMIN", {
      method: "POST",
      url: "/api/self-paced/plans",
      data: body,
    }),
  );
}

export function updateSelfPacedPlan(id: string, body: Partial<SelfPacedPlanBody>) {
  return unwrap<SelfPacedPlan>(
    authedRequest<ApiSuccess<SelfPacedPlan>>("SUPERADMIN", {
      method: "PATCH",
      url: `/api/self-paced/plans/${id}`,
      data: body,
    }),
  );
}

export function deleteSelfPacedPlan(id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>("SUPERADMIN", {
      method: "DELETE",
      url: `/api/self-paced/plans/${id}`,
    }),
  );
}

// ─── YTT COURSE HELPERS (shared shape) ───────────────────────────────────────

export type YTTPlanBody = {
  name: string;
  description?: string;
  validity: number;
  price: number;
  originalPrice?: number;
  features?: string[];
  isActive?: boolean;
};

// ─── YTT RECORDED PLANS ───────────────────────────────────────────────────────

export function listYTTRecordedCourses() {
  return unwrap<YTTCourse[]>(
    authedRequest<ApiSuccess<YTTCourse[]>>("SUPERADMIN", {
      method: "GET",
      url: "/api/ytt-recorded",
    }),
  );
}

export function listYTTRecordedPlans(courseId: string) {
  return unwrap<YTTPlan[]>(
    authedRequest<ApiSuccess<YTTPlan[]>>("SUPERADMIN", {
      method: "GET",
      url: `/api/ytt-recorded/${courseId}/plans`,
    }),
  );
}

export function createYTTRecordedPlan(courseId: string, body: YTTPlanBody) {
  return unwrap<YTTPlan>(
    authedRequest<ApiSuccess<YTTPlan>>("SUPERADMIN", {
      method: "POST",
      url: `/api/ytt-recorded/${courseId}/plans`,
      data: body,
    }),
  );
}

export function updateYTTRecordedPlan(courseId: string, planId: string, body: Partial<YTTPlanBody>) {
  return unwrap<YTTPlan>(
    authedRequest<ApiSuccess<YTTPlan>>("SUPERADMIN", {
      method: "PATCH",
      url: `/api/ytt-recorded/${courseId}/plans/${planId}`,
      data: body,
    }),
  );
}

export function deleteYTTRecordedPlan(courseId: string, planId: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>("SUPERADMIN", {
      method: "DELETE",
      url: `/api/ytt-recorded/${courseId}/plans/${planId}`,
    }),
  );
}

// ─── YTT LIVE PLANS ───────────────────────────────────────────────────────────

export function listYTTLiveCourses() {
  return unwrap<YTTCourse[]>(
    authedRequest<ApiSuccess<YTTCourse[]>>("SUPERADMIN", {
      method: "GET",
      url: "/api/ytt-live",
    }),
  );
}

export function listYTTLivePlans(courseId: string) {
  return unwrap<YTTPlan[]>(
    authedRequest<ApiSuccess<YTTPlan[]>>("SUPERADMIN", {
      method: "GET",
      url: `/api/ytt-live/${courseId}/plans`,
    }),
  );
}

export function createYTTLivePlan(courseId: string, body: YTTPlanBody) {
  return unwrap<YTTPlan>(
    authedRequest<ApiSuccess<YTTPlan>>("SUPERADMIN", {
      method: "POST",
      url: `/api/ytt-live/${courseId}/plans`,
      data: body,
    }),
  );
}

export function updateYTTLivePlan(courseId: string, planId: string, body: Partial<YTTPlanBody>) {
  return unwrap<YTTPlan>(
    authedRequest<ApiSuccess<YTTPlan>>("SUPERADMIN", {
      method: "PATCH",
      url: `/api/ytt-live/${courseId}/plans/${planId}`,
      data: body,
    }),
  );
}

export function deleteYTTLivePlan(courseId: string, planId: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>("SUPERADMIN", {
      method: "DELETE",
      url: `/api/ytt-live/${courseId}/plans/${planId}`,
    }),
  );
}
