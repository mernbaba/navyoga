import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type AttendanceStatus,
  type FrontlineAttendance,
  type OperationsAttendance,
  type PaginatedAttendance,
  type Role,
  type StudentAttendance,
  type TutorAttendance,
} from "./types";

export type AttendanceListParams = {
  q?: string;
  status?: AttendanceStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export type StudentAttendanceListParams = AttendanceListParams & {
  subscriptionClassId?: string;
};

export function listStudentAttendance(role: Role, params: StudentAttendanceListParams = {}) {
  return unwrap<PaginatedAttendance<StudentAttendance>>(
    authedRequest<ApiSuccess<PaginatedAttendance<StudentAttendance>>>(role, {
      method: "GET",
      url: "/api/attendance/students",
      params,
    }),
  );
}

export function listTutorAttendance(role: Role, params: AttendanceListParams = {}) {
  return unwrap<PaginatedAttendance<TutorAttendance>>(
    authedRequest<ApiSuccess<PaginatedAttendance<TutorAttendance>>>(role, {
      method: "GET",
      url: "/api/attendance/tutors",
      params,
    }),
  );
}

export function listFrontlineAttendance(role: Role, params: AttendanceListParams = {}) {
  return unwrap<PaginatedAttendance<FrontlineAttendance>>(
    authedRequest<ApiSuccess<PaginatedAttendance<FrontlineAttendance>>>(role, {
      method: "GET",
      url: "/api/attendance/frontline",
      params,
    }),
  );
}

export function listOperationsAttendance(role: Role, params: AttendanceListParams = {}) {
  return unwrap<PaginatedAttendance<OperationsAttendance>>(
    authedRequest<ApiSuccess<PaginatedAttendance<OperationsAttendance>>>(role, {
      method: "GET",
      url: "/api/attendance/operations",
      params,
    }),
  );
}
