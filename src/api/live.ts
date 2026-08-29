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
  // "Today"/"Tomorrow"/"Yesterday" filter: the calendar date the client
  // resolved in its own timezone (YYYY-MM-DD), plus that timezone's UTC
  // offset in minutes (Date#getTimezoneOffset) so the server can compute the
  // matching UTC range without knowing the visitor's timezone itself.
  localDate?: string;
  tzOffsetMinutes?: number;
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
  endDate: string;
  description?: string;
  tutorId?: string;
  batchId?: string;
};

export type RecurringLiveClassUpdateBody = Partial<
  Omit<RecurringLiveClassCreateBody, "batchId">
> & {
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

// The backend materialises the whole schedule synchronously on create/update and
// clears the upcoming instances on update/delete, so these return the counts.
export type RecurringCreateResult = RecurringLiveClass & { generatedCount: number };
export type RecurringUpdateResult = RecurringLiveClass & {
  removedCount: number;
  generatedCount: number;
};

export function createRecurringLiveClass(role: Role, body: RecurringLiveClassCreateBody) {
  return unwrap<RecurringCreateResult>(
    authedRequest<ApiSuccess<RecurringCreateResult>>(role, {
      method: "POST",
      url: "/api/live/recurring",
      data: body,
    }),
  );
}

export function updateRecurringLiveClass(role: Role, id: string, body: RecurringLiveClassUpdateBody) {
  return unwrap<RecurringUpdateResult>(
    authedRequest<ApiSuccess<RecurringUpdateResult>>(role, {
      method: "PATCH",
      url: `/api/live/recurring/${id}`,
      data: body,
    }),
  );
}

export function deleteRecurringLiveClass(role: Role, id: string) {
  return unwrap<{ removedCount: number }>(
    authedRequest<ApiSuccess<{ removedCount: number }>>(role, {
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
