import { authedRequest } from "../lib/apiClient";
import type { StudentRegisterBody } from "./auth";
import {
  unwrap,
  type ApiSuccess,
  type Paginated,
  type Role,
  type Student,
} from "./types";

export type StudentListParams = {
  q?: string;
  page?: number;
  limit?: number;
};

export type StudentCreateBody = StudentRegisterBody & { isActive?: boolean };

export type StudentUpdateBody = Partial<Omit<StudentCreateBody, "password">> & {
  password?: string;
  avatar?: string | null;
  city?: string | null;
  country?: string | null;
  age?: number | null;
  bloodGroup?: string | null;
  emergencyContact?: string | null;
  medicalConditions?: string | null;
  yogaExperience?: string | null;
  currentLevel?: string | null;
  areasOfInterest?: string | null;
  isActive?: boolean;
};

export function listStudents(role: Role, params: StudentListParams = {}) {
  return unwrap<Paginated<Student>>(
    authedRequest<ApiSuccess<Paginated<Student>>>(role, {
      method: "GET",
      url: "/api/students",
      params,
    }),
  );
}

export function getStudent(role: Role, id: string) {
  return unwrap<Student>(
    authedRequest<ApiSuccess<Student>>(role, {
      method: "GET",
      url: `/api/students/${id}`,
    }),
  );
}

export function createStudent(role: Role, body: StudentCreateBody) {
  return unwrap<Student>(
    authedRequest<ApiSuccess<Student>>(role, {
      method: "POST",
      url: "/api/students",
      data: body,
    }),
  );
}

export function updateStudent(role: Role, id: string, body: StudentUpdateBody) {
  return unwrap<Student>(
    authedRequest<ApiSuccess<Student>>(role, {
      method: "PATCH",
      url: `/api/students/${id}`,
      data: body,
    }),
  );
}

export function deleteStudent(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `/api/students/${id}`,
    }),
  );
}

// ─── ENROLLMENTS (SUBSCRIPTIONS) ─────────────────────────────────────────────

export type EnrollmentStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export type EnrollmentType = "live" | "self-paced" | "ytt-live" | "ytt-recorded";

export type EnrollmentPlanLite = {
  id: string;
  name: string;
  validity: number;
  price: string;
};

type EnrollmentBase = {
  id: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: EnrollmentStatus;
  createdAt: string;
  plan: EnrollmentPlanLite | null;
};

export type LiveEnrollmentRow = EnrollmentBase & {
  batchId: string;
  batch: { id: string; name: string } | null;
};

export type CourseEnrollmentRow = EnrollmentBase & {
  course: { id: string; title: string } | null;
};

export type StudentEnrollments = {
  live: LiveEnrollmentRow[];
  selfPaced: EnrollmentBase[];
  yttLive: CourseEnrollmentRow[];
  yttRecorded: CourseEnrollmentRow[];
};

export type EnrollmentUpdateBody = {
  endDate?: string;
  batchId?: string;
  status?: EnrollmentStatus;
};

export function listStudentEnrollments(role: Role, studentId: string) {
  return unwrap<StudentEnrollments>(
    authedRequest<ApiSuccess<StudentEnrollments>>(role, {
      method: "GET",
      url: `/api/students/${studentId}/enrollments`,
    }),
  );
}

export function updateStudentEnrollment(
  role: Role,
  studentId: string,
  type: EnrollmentType,
  enrollmentId: string,
  body: EnrollmentUpdateBody,
) {
  return unwrap(
    authedRequest<ApiSuccess<unknown>>(role, {
      method: "PATCH",
      url: `/api/students/${studentId}/enrollments/${type}/${enrollmentId}`,
      data: body,
    }),
  );
}

// Manually grant (enable) a subscription — used when the online payment failed
// but the student paid out-of-band, or for a cash purchase. Records a PAID
// "MANUAL" payment so the amount shows up in the finance reports.
export type GrantEnrollmentBody = {
  type: EnrollmentType;
  planId: string;
  // amount actually collected, GST-inclusive (rupees). 0 = complimentary.
  amount: number;
  batchId?: string; // required for type "live"
  courseId?: string; // required for "ytt-live" / "ytt-recorded"
  startDate?: string; // ISO; defaults to now server-side
  method?: string; // "cash" | "bank" | "upi" | ... (free text)
  notes?: string;
};

export type GrantEnrollmentResult = {
  paymentId: string;
  enrollmentId: string;
};

export function grantStudentEnrollment(
  role: Role,
  studentId: string,
  body: GrantEnrollmentBody,
) {
  return unwrap<GrantEnrollmentResult>(
    authedRequest<ApiSuccess<GrantEnrollmentResult>>(role, {
      method: "POST",
      url: `/api/students/${studentId}/enrollments`,
      data: body,
    }),
  );
}
