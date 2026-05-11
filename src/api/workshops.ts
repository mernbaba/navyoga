import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type Paginated,
  type Role,
  type Workshop,
  type WorkshopWithSessions,
  type WorkshopSession,
  type WorkshopEnrollmentRow,
  type MyWorkshopEnrollmentResponse,
  type WorkshopMode,
  type ClassLevel,
  type WorkshopSessionStatus,
} from "./types";

const BASE = "/api/workshops";

// ─── ADMIN: Workshops CRUD ───────────────────────────────────────────────────

export type WorkshopListParams = {
  q?: string;
  mode?: WorkshopMode;
  tutorId?: string;
  level?: ClassLevel;
  page?: number;
  limit?: number;
};

export type CreateWorkshopInput = {
  title: string;
  description: string;
  yogaType: string;
  mode: WorkshopMode;
  price: number;
  level?: ClassLevel;
  thumbnail?: string;
  tutorId?: string;
  instructorName?: string;
  startDate?: string;
  endDate?: string;
  totalDuration?: number;
  capacity?: number;
};

export type UpdateWorkshopInput = Partial<CreateWorkshopInput>;

export function listWorkshops(role: Role, params: WorkshopListParams = {}) {
  return unwrap<Paginated<Workshop>>(
    authedRequest<ApiSuccess<Paginated<Workshop>>>(role, {
      method: "GET",
      url: BASE,
      params,
    }),
  );
}

export function getWorkshop(role: Role, id: string) {
  return unwrap<WorkshopWithSessions>(
    authedRequest<ApiSuccess<WorkshopWithSessions>>(role, {
      method: "GET",
      url: `${BASE}/${id}`,
    }),
  );
}

export function createWorkshop(role: Role, data: CreateWorkshopInput) {
  return unwrap<Workshop>(
    authedRequest<ApiSuccess<Workshop>>(role, {
      method: "POST",
      url: BASE,
      data,
    }),
  );
}

export function updateWorkshop(role: Role, id: string, data: UpdateWorkshopInput) {
  return unwrap<Workshop>(
    authedRequest<ApiSuccess<Workshop>>(role, {
      method: "PATCH",
      url: `${BASE}/${id}`,
      data,
    }),
  );
}

export function deleteWorkshop(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `${BASE}/${id}`,
    }),
  );
}

export type WorkshopThumbnailPresign = {
  url: string;
  storePath: string;
  expiresIn: number;
};

export function requestWorkshopThumbnailPresign(
  role: Role,
  workshopId: string,
  body: { filename: string; contentType: string },
) {
  return unwrap<WorkshopThumbnailPresign>(
    authedRequest<ApiSuccess<WorkshopThumbnailPresign>>(role, {
      method: "POST",
      url: `${BASE}/${workshopId}/thumbnail-presign`,
      data: body,
    }),
  );
}

// ─── ADMIN: Sessions ─────────────────────────────────────────────────────────

export type CreateSessionInput = {
  title: string;
  sortOrder: number;
  mode?: WorkshopMode;
  scheduledAt?: string | null;
  duration?: number | null;
  link?: string | null;
  video?: string | null;
  status?: WorkshopSessionStatus | null;
};

export type UpdateSessionInput = Partial<CreateSessionInput>;

export function listWorkshopSessions(role: Role, workshopId: string) {
  return unwrap<WorkshopSession[]>(
    authedRequest<ApiSuccess<WorkshopSession[]>>(role, {
      method: "GET",
      url: `${BASE}/${workshopId}/sessions`,
    }),
  );
}

export function addWorkshopSession(role: Role, workshopId: string, data: CreateSessionInput) {
  return unwrap<WorkshopSession>(
    authedRequest<ApiSuccess<WorkshopSession>>(role, {
      method: "POST",
      url: `${BASE}/${workshopId}/sessions`,
      data,
    }),
  );
}

export function updateWorkshopSession(
  role: Role,
  workshopId: string,
  sessionId: string,
  data: UpdateSessionInput,
) {
  return unwrap<WorkshopSession>(
    authedRequest<ApiSuccess<WorkshopSession>>(role, {
      method: "PATCH",
      url: `${BASE}/${workshopId}/sessions/${sessionId}`,
      data,
    }),
  );
}

export function deleteWorkshopSession(role: Role, workshopId: string, sessionId: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `${BASE}/${workshopId}/sessions/${sessionId}`,
    }),
  );
}

// ─── ADMIN: Enrollments ──────────────────────────────────────────────────────

export type WorkshopEnrollmentListParams = {
  q?: string;
  page?: number;
  limit?: number;
};

export function listWorkshopEnrollments(
  role: Role,
  workshopId: string,
  params: WorkshopEnrollmentListParams = {},
) {
  return unwrap<Paginated<WorkshopEnrollmentRow>>(
    authedRequest<ApiSuccess<Paginated<WorkshopEnrollmentRow>>>(role, {
      method: "GET",
      url: `${BASE}/${workshopId}/enrollments`,
      params,
    }),
  );
}

export function enrollStudentInWorkshop(role: Role, workshopId: string, studentId: string) {
  return unwrap<WorkshopEnrollmentRow>(
    authedRequest<ApiSuccess<WorkshopEnrollmentRow>>(role, {
      method: "POST",
      url: `${BASE}/${workshopId}/enrollments`,
      data: { studentId },
    }),
  );
}

export function updateWorkshopEnrollment(
  role: Role,
  workshopId: string,
  enrollmentId: string,
  data: { completedAt?: string | null },
) {
  return unwrap<WorkshopEnrollmentRow>(
    authedRequest<ApiSuccess<WorkshopEnrollmentRow>>(role, {
      method: "PATCH",
      url: `${BASE}/${workshopId}/enrollments/${enrollmentId}`,
      data,
    }),
  );
}

export function removeWorkshopEnrollment(role: Role, workshopId: string, enrollmentId: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `${BASE}/${workshopId}/enrollments/${enrollmentId}`,
    }),
  );
}

// ─── STUDENT: Public/enrollment ──────────────────────────────────────────────

export type UpcomingWorkshopParams = {
  q?: string;
  mode?: WorkshopMode;
  level?: ClassLevel;
  page?: number;
  limit?: number;
};

export function listUpcomingWorkshops(role: Role, params: UpcomingWorkshopParams = {}) {
  return unwrap<Paginated<Workshop>>(
    authedRequest<ApiSuccess<Paginated<Workshop>>>(role, {
      method: "GET",
      url: `${BASE}/upcoming`,
      params,
    }),
  );
}

export function listMyWorkshopEnrolledIds(role: Role) {
  return unwrap<{ workshopIds: string[] }>(
    authedRequest<ApiSuccess<{ workshopIds: string[] }>>(role, {
      method: "GET",
      url: `${BASE}/my-enrolled-ids`,
    }),
  );
}

export function getMyWorkshopEnrollment(role: Role, workshopId: string) {
  return unwrap<MyWorkshopEnrollmentResponse>(
    authedRequest<ApiSuccess<MyWorkshopEnrollmentResponse>>(role, {
      method: "GET",
      url: `${BASE}/${workshopId}/enrollment`,
    }),
  );
}

export function enrollInFreeWorkshop(role: Role, workshopId: string) {
  return unwrap<MyWorkshopEnrollmentResponse>(
    authedRequest<ApiSuccess<MyWorkshopEnrollmentResponse>>(role, {
      method: "POST",
      url: `${BASE}/${workshopId}/enrollment`,
    }),
  );
}
