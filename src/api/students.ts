import { authedRequest } from "../lib/apiClient";
import type { StudentRegisterBody } from "./auth";
import {
  unwrap,
  type ApiSuccess,
  type Paginated,
  type Role,
  type Student,
  type StudentStatus,
} from "./types";

export type StudentListParams = {
  q?: string;
  status?: StudentStatus;
  page?: number;
  limit?: number;
};

export type StudentCreateBody = StudentRegisterBody;

export type StudentUpdateBody = Partial<Omit<StudentCreateBody, "password">> & {
  studentId?: string;
  avatar?: string | null;
  address?: string | null;
  age?: number | null;
  bloodGroup?: string | null;
  emergencyContact?: string | null;
  medicalConditions?: string | null;
  yogaExperience?: string | null;
  currentLevel?: string | null;
  areasOfInterest?: string | null;
  fitnessGoals?: string | null;
  status?: StudentStatus;
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
