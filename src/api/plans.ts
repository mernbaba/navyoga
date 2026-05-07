import { authedRequest } from "../lib/apiClient";
import { unwrap, type ApiSuccess, type LiveClassStatus, type MembershipPeriod, type SubscriptionPlan, type SelfPacedPlan, type YTTCourse, type YTTPlan, type YTTCourseDetail, type YTTModule, type YTTClass, type YTTLiveClass, type YTTLiveClassBody, type YTTLiveCourseDetail, type YTTCourseBody } from "./types";

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

export function getYTTRecordedCourse(courseId: string) {
  return unwrap<YTTCourseDetail>(
    authedRequest<ApiSuccess<YTTCourseDetail>>("SUPERADMIN", {
      method: "GET",
      url: `/api/ytt-recorded/${courseId}`,
    }),
  );
}

export type YTTModuleBody = { title: string };

export function createYTTRecordedModule(courseId: string, body: YTTModuleBody) {
  return unwrap<YTTModule>(
    authedRequest<ApiSuccess<YTTModule>>("SUPERADMIN", {
      method: "POST",
      url: `/api/ytt-recorded/${courseId}/modules`,
      data: body,
    }),
  );
}

export function deleteYTTRecordedModule(courseId: string, moduleId: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>("SUPERADMIN", {
      method: "DELETE",
      url: `/api/ytt-recorded/${courseId}/modules/${moduleId}`,
    }),
  );
}

export type YTTClassBody = {
  title: string;
  videoUrl: string;
  duration: number;
  description?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
};

export function createYTTRecordedClass(courseId: string, moduleId: string, body: YTTClassBody) {
  return unwrap<YTTClass>(
    authedRequest<ApiSuccess<YTTClass>>("SUPERADMIN", {
      method: "POST",
      url: `/api/ytt-recorded/${courseId}/modules/${moduleId}/classes`,
      data: body,
    }),
  );
}

export function updateYTTRecordedClass(
  courseId: string,
  moduleId: string,
  classId: string,
  body: Partial<YTTClassBody>,
) {
  return unwrap<YTTClass>(
    authedRequest<ApiSuccess<YTTClass>>("SUPERADMIN", {
      method: "PATCH",
      url: `/api/ytt-recorded/${courseId}/modules/${moduleId}/classes/${classId}`,
      data: body,
    }),
  );
}

export function deleteYTTRecordedClass(courseId: string, moduleId: string, classId: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>("SUPERADMIN", {
      method: "DELETE",
      url: `/api/ytt-recorded/${courseId}/modules/${moduleId}/classes/${classId}`,
    }),
  );
}

export function reorderYTTRecordedModules(
  courseId: string,
  items: { id: string; sortOrder: number }[],
) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>("SUPERADMIN", {
      method: "PATCH",
      url: `/api/ytt-recorded/${courseId}/modules/reorder`,
      data: { items },
    }),
  );
}

export function reorderYTTRecordedClasses(
  courseId: string,
  moduleId: string,
  items: { id: string; sortOrder: number }[],
) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>("SUPERADMIN", {
      method: "PATCH",
      url: `/api/ytt-recorded/${courseId}/modules/${moduleId}/classes/reorder`,
      data: { items },
    }),
  );
}

// ─── YTT LIVE COURSES + PLANS ────────────────────────────────────────────────

export function listYTTLiveCourses() {
  return unwrap<YTTCourse[]>(
    authedRequest<ApiSuccess<YTTCourse[]>>("SUPERADMIN", {
      method: "GET",
      url: "/api/ytt-live",
    }),
  );
}

export function getYTTLiveCourse(courseId: string) {
  return unwrap<YTTLiveCourseDetail>(
    authedRequest<ApiSuccess<YTTLiveCourseDetail>>("SUPERADMIN", {
      method: "GET",
      url: `/api/ytt-live/${courseId}`,
    }),
  );
}

export function createYTTLiveCourse(body: YTTCourseBody) {
  return unwrap<YTTCourse>(
    authedRequest<ApiSuccess<YTTCourse>>("SUPERADMIN", {
      method: "POST",
      url: "/api/ytt-live",
      data: body,
    }),
  );
}

export function updateYTTLiveCourse(courseId: string, body: Partial<YTTCourseBody>) {
  return unwrap<YTTCourse>(
    authedRequest<ApiSuccess<YTTCourse>>("SUPERADMIN", {
      method: "PATCH",
      url: `/api/ytt-live/${courseId}`,
      data: body,
    }),
  );
}

export function deleteYTTLiveCourse(courseId: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>("SUPERADMIN", {
      method: "DELETE",
      url: `/api/ytt-live/${courseId}`,
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

// ─── YTT LIVE CLASSES ────────────────────────────────────────────────────────

export type YTTLiveClassListParams = {
  status?: LiveClassStatus;
  q?: string;
};

export function listYTTLiveClasses(courseId: string, params: YTTLiveClassListParams = {}) {
  return unwrap<YTTLiveClass[]>(
    authedRequest<ApiSuccess<YTTLiveClass[]>>("SUPERADMIN", {
      method: "GET",
      url: `/api/ytt-live/${courseId}/classes`,
      params,
    }),
  );
}

export function getYTTLiveClass(courseId: string, classId: string) {
  return unwrap<YTTLiveClass>(
    authedRequest<ApiSuccess<YTTLiveClass>>("SUPERADMIN", {
      method: "GET",
      url: `/api/ytt-live/${courseId}/classes/${classId}`,
    }),
  );
}

export function createYTTLiveClass(courseId: string, body: YTTLiveClassBody) {
  return unwrap<YTTLiveClass>(
    authedRequest<ApiSuccess<YTTLiveClass>>("SUPERADMIN", {
      method: "POST",
      url: `/api/ytt-live/${courseId}/classes`,
      data: body,
    }),
  );
}

export function updateYTTLiveClass(courseId: string, classId: string, body: Partial<YTTLiveClassBody>) {
  return unwrap<YTTLiveClass>(
    authedRequest<ApiSuccess<YTTLiveClass>>("SUPERADMIN", {
      method: "PATCH",
      url: `/api/ytt-live/${courseId}/classes/${classId}`,
      data: body,
    }),
  );
}

export function deleteYTTLiveClass(courseId: string, classId: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>("SUPERADMIN", {
      method: "DELETE",
      url: `/api/ytt-live/${courseId}/classes/${classId}`,
    }),
  );
}
