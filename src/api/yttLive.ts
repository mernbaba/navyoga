import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type Role,
  type YTTCourse,
  type YTTLiveClass,
  type YTTPlan,
} from "./types";

const BASE = "/api/ytt-live";

// Classes returned to non-enrolled students omit `recording`.
// Mark it optional for safety when consuming the catalogue endpoint.
export type YTTLiveStudentClass = Omit<YTTLiveClass, "recording"> & {
  recording?: string | null;
};

export type YTTLiveStudentCourseDetail = YTTCourse & {
  plans: YTTPlan[];
  classes: YTTLiveStudentClass[];
  enrolled: boolean;
};

export type YTTLiveEnrollmentInfo = {
  id: string;
  courseId: string;
  planId: string;
  planName: string;
  startDate: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  course: {
    id: string;
    title: string;
    thumbnail: string | null;
    yogaType: string;
    level: string;
  };
};

export type MyYTTLiveCourseEnrollment = {
  enrolled: boolean;
  enrollment: YTTLiveEnrollmentInfo | null;
};

// ─── CATALOGUE (student-accessible) ──────────────────────────────────────────

export function listYTTLiveCoursesForStudent(role: Role = "STUDENT") {
  return unwrap<YTTCourse[]>(
    authedRequest<ApiSuccess<YTTCourse[]>>(role, {
      method: "GET",
      url: BASE,
    }),
  );
}

export function getYTTLiveCourseForStudent(courseId: string, role: Role = "STUDENT") {
  return unwrap<YTTLiveStudentCourseDetail>(
    authedRequest<ApiSuccess<YTTLiveStudentCourseDetail>>(role, {
      method: "GET",
      url: `${BASE}/${courseId}`,
    }),
  );
}

export function listYTTLiveClassesForStudent(courseId: string, role: Role = "STUDENT") {
  return unwrap<YTTLiveStudentClass[]>(
    authedRequest<ApiSuccess<YTTLiveStudentClass[]>>(role, {
      method: "GET",
      url: `${BASE}/${courseId}/classes`,
    }),
  );
}

// ─── ENROLLMENT ──────────────────────────────────────────────────────────────

export function listMyYTTLiveEnrollments(role: Role = "STUDENT") {
  return unwrap<YTTLiveEnrollmentInfo[]>(
    authedRequest<ApiSuccess<YTTLiveEnrollmentInfo[]>>(role, {
      method: "GET",
      url: `${BASE}/my-enrollments`,
    }),
  );
}

export async function getMyYTTLiveCourseEnrollment(
  courseId: string,
  role: Role = "STUDENT",
): Promise<MyYTTLiveCourseEnrollment> {
  try {
    return await unwrap<MyYTTLiveCourseEnrollment>(
      authedRequest<ApiSuccess<MyYTTLiveCourseEnrollment>>(role, {
        method: "GET",
        url: `${BASE}/${courseId}/my-enrollment`,
      }),
    );
  } catch {
    return { enrolled: false, enrollment: null };
  }
}

export function enrollInYTTLiveCourse(
  courseId: string,
  planId: string,
  role: Role = "STUDENT",
) {
  return unwrap<{ enrolled: true; enrollment: YTTLiveEnrollmentInfo }>(
    authedRequest<ApiSuccess<{ enrolled: true; enrollment: YTTLiveEnrollmentInfo }>>(role, {
      method: "POST",
      url: `${BASE}/${courseId}/enrollments`,
      data: { planId },
    }),
  );
}
