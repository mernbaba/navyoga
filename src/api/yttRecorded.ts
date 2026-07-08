import { authedRequest } from "../lib/apiClient";
import type { RenewalPrompt } from "./renewal";
import {
  unwrap,
  type ApiSuccess,
  type Role,
  type YTTCourse,
  type YTTCourseDetail,
} from "./types";

const BASE = "/api/ytt-recorded";

export type YTTRecordedEnrollmentInfo = {
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
    description: string | null;
    thumbnail: string | null;
    yogaType: string;
    level: string;
  };
};

export type MyYTTRecordedCourseEnrollment = {
  enrolled: boolean;
  enrollment: YTTRecordedEnrollmentInfo | null;
  // Present (non-null) when the student has no active enrollment for this course
  // but their last one expired within the renewal window — drives the "renew?" modal.
  recentlyExpired?: RenewalPrompt | null;
};

// ─── CATALOGUE (student-accessible) ──────────────────────────────────────────

export function listYTTRecordedCoursesForStudent(role: Role = "STUDENT") {
  return unwrap<YTTCourse[]>(
    authedRequest<ApiSuccess<YTTCourse[]>>(role, {
      method: "GET",
      url: BASE,
    }),
  );
}

export function getYTTRecordedCourseForStudent(courseId: string, role: Role = "STUDENT") {
  return unwrap<YTTCourseDetail>(
    authedRequest<ApiSuccess<YTTCourseDetail>>(role, {
      method: "GET",
      url: `${BASE}/${courseId}`,
    }),
  );
}

// ─── ENROLLMENT ──────────────────────────────────────────────────────────────

export async function listMyYTTRecordedEnrollments(
  role: Role = "STUDENT",
): Promise<YTTRecordedEnrollmentInfo[]> {
  try {
    return await unwrap<YTTRecordedEnrollmentInfo[]>(
      authedRequest<ApiSuccess<YTTRecordedEnrollmentInfo[]>>(role, {
        method: "GET",
        url: `${BASE}/my-enrollments`,
      }),
    );
  } catch {
    // Endpoint may not be deployed yet — render an empty enrolled state
    // rather than failing the whole page.
    return [];
  }
}

export async function getMyYTTRecordedCourseEnrollment(
  courseId: string,
  role: Role = "STUDENT",
): Promise<MyYTTRecordedCourseEnrollment> {
  try {
    return await unwrap<MyYTTRecordedCourseEnrollment>(
      authedRequest<ApiSuccess<MyYTTRecordedCourseEnrollment>>(role, {
        method: "GET",
        url: `${BASE}/${courseId}/my-enrollment`,
      }),
    );
  } catch {
    return { enrolled: false, enrollment: null };
  }
}

// ─── PROGRESS ────────────────────────────────────────────────────────────────

export type YTTRecordedProgress = {
  id: string;
  classId: string;
  progress: number;
  isCompleted: boolean;
  lastWatchedAt: string | null;
  updatedAt: string;
};

export async function listMyYTTRecordedProgress(
  courseId: string,
  role: Role = "STUDENT",
): Promise<YTTRecordedProgress[]> {
  try {
    return await unwrap<YTTRecordedProgress[]>(
      authedRequest<ApiSuccess<YTTRecordedProgress[]>>(role, {
        method: "GET",
        url: `${BASE}/${courseId}/my-progress`,
      }),
    );
  } catch {
    return [];
  }
}

export function upsertYTTRecordedProgress(
  courseId: string,
  classId: string,
  body: { progress?: number; isCompleted?: boolean },
  role: Role = "STUDENT",
) {
  return unwrap<YTTRecordedProgress>(
    authedRequest<ApiSuccess<YTTRecordedProgress>>(role, {
      method: "POST",
      url: `${BASE}/${courseId}/classes/${classId}/progress`,
      data: body,
    }),
  );
}
