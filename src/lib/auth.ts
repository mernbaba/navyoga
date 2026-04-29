import axios from "axios";
import type { LoginRole } from "../components/auth/RoleLoginPage";
import { apiClient } from "./apiClient";

const roleToPathSegment: Record<LoginRole, string> = {
  SUPERADMIN: "superadmin",
  TUTOR: "tutor",
  OPERATIONS: "operations",
  FRONTLINE: "frontline",
  STUDENT: "student",
};

export const ROLE_TOKEN_KEYS: Record<LoginRole, string> = {
  SUPERADMIN: "NV_SA_TOKEN",
  TUTOR: "NV_TU_TOKEN",
  OPERATIONS: "NV_OP_TOKEN",
  FRONTLINE: "NV_FA_TOKEN",
  STUDENT: "NV_US_TOKEN",
};

export const ROLE_USER_KEYS: Record<LoginRole, string> = {
  SUPERADMIN: "NV_SA_USER",
  TUTOR: "NV_TU_USER",
  OPERATIONS: "NV_OP_USER",
  FRONTLINE: "NV_FA_USER",
  STUDENT: "NV_US_USER",
};

export const ROLE_LOGIN_PATHS: Record<LoginRole, string> = {
  SUPERADMIN: "/login/superadmin",
  TUTOR: "/login/tutor",
  OPERATIONS: "/login/operations",
  FRONTLINE: "/login/frontline",
  STUDENT: "/login",
};

export function setRoleAuth(role: LoginRole, token: string, user: unknown) {
  localStorage.setItem(ROLE_TOKEN_KEYS[role], token);
  localStorage.setItem(ROLE_USER_KEYS[role], JSON.stringify(user));
}

export function clearRoleAuth(role: LoginRole) {
  localStorage.removeItem(ROLE_TOKEN_KEYS[role]);
  localStorage.removeItem(ROLE_USER_KEYS[role]);
}

export function getRoleToken(role: LoginRole): string | null {
  return localStorage.getItem(ROLE_TOKEN_KEYS[role]);
}

export function isRoleAuthenticated(role: LoginRole): boolean {
  return Boolean(getRoleToken(role));
}

type AuthSuccessResponse = {
  success: true;
  message: string;
  data: {
    user: Record<string, unknown>;
    token: string;
  };
};

type AuthFailureResponse = {
  success: false;
  message: string;
  error?: unknown;
};

export async function loginWithRole(role: LoginRole, email: string, password: string) {
  try {
    const { data } = await apiClient.post<AuthSuccessResponse>(
      `/api/auth/${roleToPathSegment[role]}/login`,
      { email, password },
    );

    if (!data?.success) {
      throw new Error("Unexpected auth response.");
    }

    return data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data as AuthFailureResponse | undefined;
      throw new Error(payload?.message ?? "Unable to sign in right now.");
    }
    throw error;
  }
}