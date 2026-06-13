import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type Paginated,
  type Role,
  type AppEvent,
  type EventEnrollmentRow,
} from "./types";

export type EventListParams = {
  q?: string;
  featured?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export type CreateEventInput = {
  title: string;
  description: string;
  date: string;
  duration: string;
  location: string;
  capacity: number;
  price: number;
  thumbnail?: string;
  featured?: boolean;
};

export type UpdateEventInput = Partial<CreateEventInput>;

export function listEvents(role: Role, params: EventListParams = {}) {
  return unwrap<Paginated<AppEvent>>(
    authedRequest<ApiSuccess<Paginated<AppEvent>>>(role, {
      method: "GET",
      url: "/api/events",
      params,
    }),
  );
}

export type EventStats = {
  total: number;
  upcoming: number;
  featured: number;
  totalCapacity: number;
};

// Admin/operations stat cards — aggregates across ALL events, independent of
// the paginated list, so the cards don't show only the current page's data.
export function getEventStats(role: Role) {
  return unwrap<EventStats>(
    authedRequest<ApiSuccess<EventStats>>(role, {
      method: "GET",
      url: "/api/events/stats",
    }),
  );
}

export function getEvent(role: Role, id: string) {
  return unwrap<AppEvent>(
    authedRequest<ApiSuccess<AppEvent>>(role, {
      method: "GET",
      url: `/api/events/${id}`,
    }),
  );
}

export function createEvent(role: Role, data: CreateEventInput) {
  return unwrap<AppEvent>(
    authedRequest<ApiSuccess<AppEvent>>(role, {
      method: "POST",
      url: "/api/events",
      data,
    }),
  );
}

export function updateEvent(role: Role, id: string, data: UpdateEventInput) {
  return unwrap<AppEvent>(
    authedRequest<ApiSuccess<AppEvent>>(role, {
      method: "PATCH",
      url: `/api/events/${id}`,
      data,
    }),
  );
}

export type EnrollmentListParams = {
  q?: string;
  page?: number;
  limit?: number;
};

export function listEventEnrollments(role: Role, eventId: string, params: EnrollmentListParams = {}) {
  return unwrap<Paginated<EventEnrollmentRow>>(
    authedRequest<ApiSuccess<Paginated<EventEnrollmentRow>>>(role, {
      method: "GET",
      url: `/api/events/${eventId}/enrollments`,
      params,
    }),
  );
}

export function deleteEvent(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `/api/events/${id}`,
    }),
  );
}

export type EventThumbnailPresign = {
  url: string;
  storePath: string;
  expiresIn: number;
};

export function requestEventThumbnailPresign(
  role: Role,
  eventId: string,
  body: { filename: string; contentType: string },
) {
  return unwrap<EventThumbnailPresign>(
    authedRequest<ApiSuccess<EventThumbnailPresign>>(role, {
      method: "POST",
      url: `/api/events/${eventId}/thumbnail-presign`,
      data: body,
    }),
  );
}

export type UpcomingEventListParams = {
  q?: string;
  page?: number;
  limit?: number;
};

export type MyEnrollmentResponse = {
  enrolled: boolean;
  enrollment: { id: string; enrolledAt: string } | null;
};

export function listUpcomingEvents(role: Role, params: UpcomingEventListParams = {}) {
  return unwrap<Paginated<AppEvent>>(
    authedRequest<ApiSuccess<Paginated<AppEvent>>>(role, {
      method: "GET",
      url: "/api/events/upcoming",
      params,
    }),
  );
}

export type UpcomingEventStats = {
  total: number;
  upcoming: number;
  featured: number;
  registered: number;
};

// Aggregates across ALL upcoming events (not the current page) for the stat
// cards, so they stay correct independent of pagination.
export function getUpcomingEventStats(role: Role) {
  return unwrap<UpcomingEventStats>(
    authedRequest<ApiSuccess<UpcomingEventStats>>(role, {
      method: "GET",
      url: "/api/events/upcoming/stats",
    }),
  );
}

export function getMyEventEnrollment(role: Role, eventId: string) {
  return unwrap<MyEnrollmentResponse>(
    authedRequest<ApiSuccess<MyEnrollmentResponse>>(role, {
      method: "GET",
      url: `/api/events/${eventId}/enrollment`,
    }),
  );
}

export function listMyEventEnrollments(role: Role) {
  return unwrap<{ eventIds: string[] }>(
    authedRequest<ApiSuccess<{ eventIds: string[] }>>(role, {
      method: "GET",
      url: "/api/events/my-enrollments",
    }),
  );
}

export function enrollInFreeEvent(role: Role, eventId: string) {
  return unwrap<MyEnrollmentResponse>(
    authedRequest<ApiSuccess<MyEnrollmentResponse>>(role, {
      method: "POST",
      url: `/api/events/${eventId}/enrollment`,
    }),
  );
}
