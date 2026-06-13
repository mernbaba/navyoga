import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type OperationsStaffRow,
  type Paginated,
  type Role,
  type StaffStatus,
} from "./types";

export type OperationsListParams = {
  q?: string;
  status?: StaffStatus;
  department?: string;
  page?: number;
  limit?: number;
};

export type OperationsCreateBody = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  salary: number;
  joinDate: string;
  department?: string;
  workingHours?: string;
  timezone?: string;
  avatar?: string;
};

export type OperationsUpdateBody = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  workingHours?: string | null;
  timezone?: string | null;
  salary?: number;
  joinDate?: string;
  avatar?: string | null;
  status?: StaffStatus;
  isActive?: boolean;
};

export function listOperations(role: Role, params: OperationsListParams = {}) {
  return unwrap<Paginated<OperationsStaffRow>>(
    authedRequest<ApiSuccess<Paginated<OperationsStaffRow>>>(role, {
      method: "GET",
      url: "/api/operations",
      params,
    }),
  );
}

export function getOperations(role: Role, id: string) {
  return unwrap<OperationsStaffRow>(
    authedRequest<ApiSuccess<OperationsStaffRow>>(role, {
      method: "GET",
      url: `/api/operations/${id}`,
    }),
  );
}

export function createOperations(role: Role, body: OperationsCreateBody) {
  return unwrap<OperationsStaffRow>(
    authedRequest<ApiSuccess<OperationsStaffRow>>(role, {
      method: "POST",
      url: "/api/operations",
      data: body,
    }),
  );
}

export function updateOperations(role: Role, id: string, body: OperationsUpdateBody) {
  return unwrap<OperationsStaffRow>(
    authedRequest<ApiSuccess<OperationsStaffRow>>(role, {
      method: "PATCH",
      url: `/api/operations/${id}`,
      data: body,
    }),
  );
}

export function deleteOperations(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `/api/operations/${id}`,
    }),
  );
}
