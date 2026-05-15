import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type FrontlineAgentRow,
  type Paginated,
  type Role,
  type StaffStatus,
} from "./types";

export type FrontlineListParams = {
  q?: string;
  status?: StaffStatus;
  page?: number;
  limit?: number;
};

export type FrontlineCreateBody = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  salary: number;
  joinDate: string;
  designation?: string;
  department?: string;
  dailyTarget?: number;
  avatar?: string;
};

export type FrontlineUpdateBody = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  designation?: string;
  department?: string;
  dailyTarget?: number;
  salary?: number;
  joinDate?: string;
  avatar?: string | null;
  status?: StaffStatus;
  isActive?: boolean;
};

export function listFrontline(role: Role, params: FrontlineListParams = {}) {
  return unwrap<Paginated<FrontlineAgentRow>>(
    authedRequest<ApiSuccess<Paginated<FrontlineAgentRow>>>(role, {
      method: "GET",
      url: "/api/frontline",
      params,
    }),
  );
}

export function getFrontline(role: Role, id: string) {
  return unwrap<FrontlineAgentRow>(
    authedRequest<ApiSuccess<FrontlineAgentRow>>(role, {
      method: "GET",
      url: `/api/frontline/${id}`,
    }),
  );
}

export function createFrontline(role: Role, body: FrontlineCreateBody) {
  return unwrap<FrontlineAgentRow>(
    authedRequest<ApiSuccess<FrontlineAgentRow>>(role, {
      method: "POST",
      url: "/api/frontline",
      data: body,
    }),
  );
}

export function updateFrontline(role: Role, id: string, body: FrontlineUpdateBody) {
  return unwrap<FrontlineAgentRow>(
    authedRequest<ApiSuccess<FrontlineAgentRow>>(role, {
      method: "PATCH",
      url: `/api/frontline/${id}`,
      data: body,
    }),
  );
}

export function deleteFrontline(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `/api/frontline/${id}`,
    }),
  );
}
