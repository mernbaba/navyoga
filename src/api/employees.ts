import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type Employee,
  type Paginated,
  type Role,
  type StaffStatus,
} from "./types";

export type EmployeeListParams = {
  q?: string;
  status?: StaffStatus;
  department?: string;
  role?: string;
  page?: number;
  limit?: number;
};

export type EmployeeCreateBody = {
  email: string;
  name: string;
  phone: string;
  role: string;
  department: string;
  salary: number;
  joinDate: string;
  avatar?: string;
  status?: StaffStatus;
};

export type EmployeeUpdateBody = Partial<EmployeeCreateBody> & {
  avatar?: string | null;
};

export function listEmployees(role: Role, params: EmployeeListParams = {}) {
  return unwrap<Paginated<Employee>>(
    authedRequest<ApiSuccess<Paginated<Employee>>>(role, {
      method: "GET",
      url: "/api/employees",
      params,
    }),
  );
}

export function getEmployee(role: Role, id: string) {
  return unwrap<Employee>(
    authedRequest<ApiSuccess<Employee>>(role, {
      method: "GET",
      url: `/api/employees/${id}`,
    }),
  );
}

export function createEmployee(role: Role, body: EmployeeCreateBody) {
  return unwrap<Employee>(
    authedRequest<ApiSuccess<Employee>>(role, {
      method: "POST",
      url: "/api/employees",
      data: body,
    }),
  );
}

export function updateEmployee(role: Role, id: string, body: EmployeeUpdateBody) {
  return unwrap<Employee>(
    authedRequest<ApiSuccess<Employee>>(role, {
      method: "PATCH",
      url: `/api/employees/${id}`,
      data: body,
    }),
  );
}

export function deleteEmployee(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `/api/employees/${id}`,
    }),
  );
}
