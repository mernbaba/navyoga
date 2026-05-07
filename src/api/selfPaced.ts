import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type Role,
  type SelfPacedModule,
  type SelfPacedClass,
  type SelfPacedPlan,
} from "./types";

const BASE = "/api/self-paced";

// ─── MODULES ─────────────────────────────────────────────────────────────────

export function listModules(role: Role) {
  return unwrap<SelfPacedModule[]>(
    authedRequest<ApiSuccess<SelfPacedModule[]>>(role, {
      method: "GET",
      url: `${BASE}/modules`,
    }),
  );
}

export function getModule(role: Role, id: string) {
  return unwrap<SelfPacedModule>(
    authedRequest<ApiSuccess<SelfPacedModule>>(role, {
      method: "GET",
      url: `${BASE}/modules/${id}`,
    }),
  );
}

export function createModule(role: Role, title: string) {
  return unwrap<SelfPacedModule>(
    authedRequest<ApiSuccess<SelfPacedModule>>(role, {
      method: "POST",
      url: `${BASE}/modules`,
      data: { title },
    }),
  );
}

export function updateModule(role: Role, id: string, data: { title?: string }) {
  return unwrap<SelfPacedModule>(
    authedRequest<ApiSuccess<SelfPacedModule>>(role, {
      method: "PATCH",
      url: `${BASE}/modules/${id}`,
      data,
    }),
  );
}

export function deleteModule(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `${BASE}/modules/${id}`,
    }),
  );
}

export function reorderModules(role: Role, items: { id: string; sortOrder: number }[]) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "PATCH",
      url: `${BASE}/modules/reorder`,
      data: { items },
    }),
  );
}

// ─── CLASSES ─────────────────────────────────────────────────────────────────

export function listClasses(role: Role, moduleId: string) {
  return unwrap<SelfPacedClass[]>(
    authedRequest<ApiSuccess<SelfPacedClass[]>>(role, {
      method: "GET",
      url: `${BASE}/modules/${moduleId}/classes`,
    }),
  );
}

export type ClassCreateBody = {
  title: string;
  videoUrl: string;
  duration: number;
  description?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
};

export type ClassUpdateBody = Partial<ClassCreateBody> & { sortOrder?: number };

export function createClass(role: Role, moduleId: string, body: ClassCreateBody) {
  return unwrap<SelfPacedClass>(
    authedRequest<ApiSuccess<SelfPacedClass>>(role, {
      method: "POST",
      url: `${BASE}/modules/${moduleId}/classes`,
      data: body,
    }),
  );
}

export function updateClass(role: Role, moduleId: string, id: string, body: ClassUpdateBody) {
  return unwrap<SelfPacedClass>(
    authedRequest<ApiSuccess<SelfPacedClass>>(role, {
      method: "PATCH",
      url: `${BASE}/modules/${moduleId}/classes/${id}`,
      data: body,
    }),
  );
}

export function deleteClass(role: Role, moduleId: string, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `${BASE}/modules/${moduleId}/classes/${id}`,
    }),
  );
}

export function reorderClasses(role: Role, moduleId: string, items: { id: string; sortOrder: number }[]) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "PATCH",
      url: `${BASE}/modules/${moduleId}/classes/reorder`,
      data: { items },
    }),
  );
}

// ─── MY SUBSCRIPTION (student) ───────────────────────────────────────────────

export type MySelfPacedSubscription = {
  enrolled: boolean;
  subscription: {
    id: string;
    planId: string;
    planName: string;
    startDate: string;
    expiresAt: string;
  } | null;
};

export async function getMySelfPacedSubscription(role: Role = "STUDENT"): Promise<MySelfPacedSubscription> {
  try {
    return await unwrap<MySelfPacedSubscription>(
      authedRequest<ApiSuccess<MySelfPacedSubscription>>(role, {
        method: "GET",
        url: `${BASE}/my-subscription`,
      }),
    );
  } catch {
    // Backend endpoint may not be deployed yet — treat the user as not enrolled
    // rather than blowing up the page.
    return { enrolled: false, subscription: null };
  }
}

export function enrollInSelfPacedPlan(planId: string, role: Role = "STUDENT") {
  return unwrap<MySelfPacedSubscription>(
    authedRequest<ApiSuccess<MySelfPacedSubscription>>(role, {
      method: "POST",
      url: `${BASE}/enrollments`,
      data: { planId },
    }),
  );
}

// ─── PROGRESS ────────────────────────────────────────────────────────────────

export type SelfPacedProgress = {
  id: string;
  classId: string;
  progress: number;
  isCompleted: boolean;
  lastWatchedAt: string | null;
  updatedAt: string;
};

export function listMySelfPacedProgress(role: Role = "STUDENT") {
  return unwrap<SelfPacedProgress[]>(
    authedRequest<ApiSuccess<SelfPacedProgress[]>>(role, {
      method: "GET",
      url: `${BASE}/my-progress`,
    }),
  );
}

export function upsertSelfPacedProgress(
  classId: string,
  body: { progress?: number; isCompleted?: boolean },
  role: Role = "STUDENT",
) {
  return unwrap<SelfPacedProgress>(
    authedRequest<ApiSuccess<SelfPacedProgress>>(role, {
      method: "POST",
      url: `${BASE}/classes/${classId}/progress`,
      data: body,
    }),
  );
}

// ─── PLANS ───────────────────────────────────────────────────────────────────

export function listPlans(role: Role) {
  return unwrap<SelfPacedPlan[]>(
    authedRequest<ApiSuccess<SelfPacedPlan[]>>(role, {
      method: "GET",
      url: `${BASE}/plans`,
    }),
  );
}

export type PlanCreateBody = {
  name: string;
  validity: number;
  price: number;
  description?: string;
  originalPrice?: number;
  features?: string[];
  isActive?: boolean;
};

export type PlanUpdateBody = Partial<PlanCreateBody>;

export function createPlan(role: Role, body: PlanCreateBody) {
  return unwrap<SelfPacedPlan>(
    authedRequest<ApiSuccess<SelfPacedPlan>>(role, {
      method: "POST",
      url: `${BASE}/plans`,
      data: body,
    }),
  );
}

export function updatePlan(role: Role, id: string, body: PlanUpdateBody) {
  return unwrap<SelfPacedPlan>(
    authedRequest<ApiSuccess<SelfPacedPlan>>(role, {
      method: "PATCH",
      url: `${BASE}/plans/${id}`,
      data: body,
    }),
  );
}

export function deletePlan(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `${BASE}/plans/${id}`,
    }),
  );
}
