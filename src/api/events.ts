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
