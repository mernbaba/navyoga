import { authedRequest, apiClient } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type AuthSuccess,
  type FrontlineUser,
  type OperationsUser,
  type Role,
  type StudentUser,
  type SuperAdminUser,
  type TutorUser,
} from "./types";

export type OperationsRegisterBody = {
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

export type FrontlineRegisterBody = {
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

const rolePath: Record<Role, string> = {
  SUPERADMIN: "superadmin",
  TUTOR: "tutor",
  OPERATIONS: "operations",
  FRONTLINE: "frontline",
  STUDENT: "student",
};

export type RoleUser = {
  SUPERADMIN: SuperAdminUser;
  TUTOR: TutorUser;
  OPERATIONS: OperationsUser;
  FRONTLINE: FrontlineUser;
  STUDENT: StudentUser;
};

export function getMe<R extends Role>(role: R) {
  return unwrap<RoleUser[R]>(
    authedRequest<ApiSuccess<RoleUser[R]>>(role, {
      method: "GET",
      url: `/api/auth/${rolePath[role]}/me`,
    }),
  );
}

export function patchMe<R extends Role>(role: R, body: Partial<RoleUser[R]> & Record<string, unknown>) {
  return unwrap<RoleUser[R]>(
    authedRequest<ApiSuccess<RoleUser[R]>>(role, {
      method: "PATCH",
      url: `/api/auth/${rolePath[role]}/me`,
      data: body,
    }),
  );
}

export function changePassword(role: Role, currentPassword: string, newPassword: string) {
  return unwrap<{ success: boolean }>(
    authedRequest<ApiSuccess<{ success: boolean }>>(role, {
      method: "POST",
      url: `/api/auth/${rolePath[role]}/change-password`,
      data: { currentPassword, newPassword },
    }),
  );
}

export function logoutOnServer(role: Role) {
  return unwrap<unknown>(
    authedRequest<ApiSuccess<unknown>>(role, {
      method: "POST",
      url: `/api/auth/${rolePath[role]}/logout`,
    }),
  );
}

export type StudentRegisterBody = {
  email: string;
  name: string;
  phone: string;
  password: string;
  avatar?: string;
  city?: string;
  country?: string;
  age?: number;
  bloodGroup?: string;
  emergencyContact?: string;
  medicalConditions?: string;
  yogaExperience?: string;
  currentLevel?: string;
  areasOfInterest?: string;
  fitnessGoals?: string;
  referredByCode?: string;
};

export async function registerStudent(body: StudentRegisterBody) {
  return unwrap<AuthSuccess<StudentUser>>(
    apiClient.post<ApiSuccess<AuthSuccess<StudentUser>>>("/api/auth/student/register", body),
  );
}

export function acceptStudentTerms() {
  return unwrap<StudentUser>(
    authedRequest<ApiSuccess<StudentUser>>("STUDENT", {
      method: "POST",
      url: "/api/auth/student/accept-terms",
    }),
  );
}

export function registerOperations(body: OperationsRegisterBody) {
  return unwrap<OperationsUser>(
    authedRequest<ApiSuccess<OperationsUser>>("SUPERADMIN", {
      method: "POST",
      url: "/api/auth/operations/register",
      data: body,
    }),
  );
}

export function registerFrontline(body: FrontlineRegisterBody) {
  return unwrap<FrontlineUser>(
    authedRequest<ApiSuccess<FrontlineUser>>("OPERATIONS", {
      method: "POST",
      url: "/api/auth/frontline/register",
      data: body,
    }),
  );
}
