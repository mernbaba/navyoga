import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type Notification,
  type NotificationAudience,
  type Paginated,
  type Role,
} from "./types";

export type NotificationListParams = {
  q?: string;
  targetAudience?: NotificationAudience;
  page?: number;
  limit?: number;
};

export type NotificationCreateBody = {
  title: string;
  message: string;
  targetAudience: NotificationAudience;
  scheduledDate?: string;
};

export type NotificationUpdateBody = {
  title?: string;
  message?: string;
  targetAudience?: NotificationAudience;
  scheduledDate?: string | null;
};

export function listNotifications(role: Role, params: NotificationListParams = {}) {
  return unwrap<Paginated<Notification>>(
    authedRequest<ApiSuccess<Paginated<Notification>>>(role, {
      method: "GET",
      url: "/api/notifications",
      params,
    }),
  );
}

export function getNotification(role: Role, id: string) {
  return unwrap<Notification>(
    authedRequest<ApiSuccess<Notification>>(role, {
      method: "GET",
      url: `/api/notifications/${id}`,
    }),
  );
}

export function createNotification(role: Role, body: NotificationCreateBody) {
  return unwrap<Notification>(
    authedRequest<ApiSuccess<Notification>>(role, {
      method: "POST",
      url: "/api/notifications",
      data: body,
    }),
  );
}

export function updateNotification(role: Role, id: string, body: NotificationUpdateBody) {
  return unwrap<Notification>(
    authedRequest<ApiSuccess<Notification>>(role, {
      method: "PATCH",
      url: `/api/notifications/${id}`,
      data: body,
    }),
  );
}

export function deleteNotification(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `/api/notifications/${id}`,
    }),
  );
}
