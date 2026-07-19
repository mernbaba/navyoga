import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type Paginated,
  type Role,
  type LiveClass,
  type ClassDifficulty,
  type RecurringLiveClass,
  type DayOfWeek,
} from "./types";

export type LiveClassListParams = {
  tutorId?: string;
  batchId?: string;
  q?: string;
  page?: number;
  limit?: number;
};

export type LiveClassCreateBody = {
  title: string;
  yogaType: string;
  difficulty: ClassDifficulty;
  duration: number;
  description?: string;
  tutorId?: string;
  batchId?: string;
  scheduledAt?: string;
  recording?: string;
};

export type LiveClassUpdateBody = {
  title?: string;
  yogaType?: string;
  difficulty?: ClassDifficulty;
  duration?: number;
  description?: string;
  tutorId?: string | null;
  batchId?: string | null;
  scheduledAt?: string | null;
  recording?: string | null;
};

export function listLiveClasses(role: Role, params: LiveClassListParams = {}) {
  return unwrap<Paginated<LiveClass>>(
    authedRequest<ApiSuccess<Paginated<LiveClass>>>(role, {
      method: "GET",
      url: "/api/live",
      params,
    }),
  );
}

export function createLiveClass(role: Role, body: LiveClassCreateBody) {
  return unwrap<LiveClass>(
    authedRequest<ApiSuccess<LiveClass>>(role, {
      method: "POST",
      url: "/api/live",
      data: body,
    }),
  );
}

export function updateLiveClass(role: Role, id: string, body: LiveClassUpdateBody) {
  return unwrap<LiveClass>(
    authedRequest<ApiSuccess<LiveClass>>(role, {
      method: "PATCH",
      url: `/api/live/${id}`,
      data: body,
    }),
  );
}

export function deleteLiveClass(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `/api/live/${id}`,
    }),
  );
}

export type LiveClassRecordingPresign = {
  url: string;
  storePath: string;
  expiresIn: number;
};

// ─── RECURRING LIVE CLASSES ───────────────────────────────────────────────────

export type RecurringLiveClassCreateBody = {
  title: string;
  yogaType: string;
  difficulty: ClassDifficulty;
  duration: number;
  daysOfWeek: DayOfWeek[];
  timeOfDay: string;
  startDate: string;
  description?: string;
  tutorId?: string;
  batchId?: string;
  endDate?: string;
};

export type RecurringLiveClassUpdateBody = Partial<RecurringLiveClassCreateBody> & {
  isActive?: boolean;
  // Nullable on update so an existing batch can be cleared back to "all batches".
  batchId?: string | null;
};

export function listRecurringLiveClasses(role: Role) {
  return unwrap<RecurringLiveClass[]>(
    authedRequest<ApiSuccess<RecurringLiveClass[]>>(role, {
      method: "GET",
      url: "/api/live/recurring",
    }),
  );
}

export function createRecurringLiveClass(role: Role, body: RecurringLiveClassCreateBody) {
  return unwrap<RecurringLiveClass>(
    authedRequest<ApiSuccess<RecurringLiveClass>>(role, {
      method: "POST",
      url: "/api/live/recurring",
      data: body,
    }),
  );
}

export function updateRecurringLiveClass(role: Role, id: string, body: RecurringLiveClassUpdateBody) {
  return unwrap<RecurringLiveClass>(
    authedRequest<ApiSuccess<RecurringLiveClass>>(role, {
      method: "PATCH",
      url: `/api/live/recurring/${id}`,
      data: body,
    }),
  );
}

export function deleteRecurringLiveClass(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `/api/live/recurring/${id}`,
    }),
  );
}

export function requestLiveClassRecordingPresign(
  role: Role,
  id: string,
  body: { filename: string; contentType: string },
) {
  return unwrap<LiveClassRecordingPresign>(
    authedRequest<ApiSuccess<LiveClassRecordingPresign>>(role, {
      method: "POST",
      url: `/api/live/${id}/recording-presign`,
      data: body,
    }),
  );
}

// ─── TUTOR self-recording (scoped to the tutor's own class) ───────────────────

export function requestTutorRecordingPresign(
  id: string,
  body: { filename: string; contentType: string },
) {
  return unwrap<LiveClassRecordingPresign>(
    authedRequest<ApiSuccess<LiveClassRecordingPresign>>("TUTOR", {
      method: "POST",
      url: `/api/live/${id}/tutor-recording-presign`,
      data: body,
    }),
  );
}

export function saveTutorRecording(id: string, storePath: string) {
  return unwrap<LiveClass>(
    authedRequest<ApiSuccess<LiveClass>>("TUTOR", {
      method: "PATCH",
      url: `/api/live/${id}/tutor-recording`,
      data: { recording: storePath },
    }),
  );
}
