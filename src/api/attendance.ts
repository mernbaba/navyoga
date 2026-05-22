import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type AttendanceStatus,
  type FrontlineAttendance,
  type MyFrontlineAttendance,
  type MyOperationsAttendance,
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

export function frontlineCheckIn(role: Role) {
  return unwrap<FrontlineAttendance>(
    authedRequest<ApiSuccess<FrontlineAttendance>>(role, {
      method: "POST",
      url: "/api/attendance/frontline/checkin",
    }),
  );
}

export function frontlineCheckOut(role: Role) {
  return unwrap<FrontlineAttendance>(
    authedRequest<ApiSuccess<FrontlineAttendance>>(role, {
      method: "POST",
      url: "/api/attendance/frontline/checkout",
    }),
  );
}

export function getMyFrontlineAttendance(role: Role) {
  return unwrap<MyFrontlineAttendance>(
    authedRequest<ApiSuccess<MyFrontlineAttendance>>(role, {
      method: "GET",
      url: "/api/attendance/frontline/me",
    }),
  );
}

export function operationsCheckIn(role: Role) {
  return unwrap<OperationsAttendance>(
    authedRequest<ApiSuccess<OperationsAttendance>>(role, {
      method: "POST",
      url: "/api/attendance/operations/checkin",
    }),
  );
}

export function operationsCheckOut(role: Role) {
  return unwrap<OperationsAttendance>(
    authedRequest<ApiSuccess<OperationsAttendance>>(role, {
      method: "POST",
      url: "/api/attendance/operations/checkout",
    }),
  );
}

export function getMyOperationsAttendance(role: Role) {
  return unwrap<MyOperationsAttendance>(
    authedRequest<ApiSuccess<MyOperationsAttendance>>(role, {
      method: "GET",
      url: "/api/attendance/operations/me",
    }),
  );
}
