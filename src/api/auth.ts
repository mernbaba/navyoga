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

export type StudentAvatarPresign = {
  url: string;
  storePath: string;
  expiresIn: number;
};

// Step 1 of avatar upload: ask the BE for a presigned S3 PUT URL. Returns the
// `storePath` (e.g. /avatars/<UUID>.jpg) to persist via patchMe once the PUT succeeds.
export function requestStudentAvatarPresign(body: { filename: string; contentType: string }) {
  return unwrap<StudentAvatarPresign>(
    authedRequest<ApiSuccess<StudentAvatarPresign>>("STUDENT", {
      method: "POST",
      url: "/api/auth/student/me/avatar-presign",
      data: body,
    }),
  );
}

// Full client-side avatar upload flow: presign → PUT file to S3 → return the
// storePath. Caller persists it by PATCHing /me with { avatar: storePath }.
export async function uploadStudentAvatar(file: File): Promise<string> {
  const contentType = file.type || "image/jpeg";
  const presign = await requestStudentAvatarPresign({
    filename: file.name,
    contentType,
  });
  const putRes = await fetch(presign.url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!putRes.ok) throw new Error("Avatar upload failed");
  return presign.storePath;
}

// Clear the student's avatar on the server (best-effort deletes the S3 object too).
export function removeStudentAvatar() {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>("STUDENT", {
      method: "DELETE",
      url: "/api/auth/student/me/avatar",
    }),
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

// ─── WhatsApp OTP (AiSensy) ───────────────────────────────────────────────────
//
// Replaces the MSG91 browser widget (src/lib/msg91Otp.ts, now unused). MSG91 ran
// the whole OTP flow client-side and handed us an access token; AiSensy is a
// server-side send API, so the BE now owns generate/send/verify and mints the
// access token itself. Both endpoints are public — password reset has no session
// yet — and the BE rate-limits per phone.

export type OtpPurpose = "PHONE_VERIFICATION" | "PASSWORD_RESET";

/** Sends a 4-digit code over WhatsApp. Also used for resends — the BE enforces
 *  its own 30s cooldown, so no separate retry endpoint is needed. */
export function sendStudentOtp(phone: string, purpose: OtpPurpose) {
  return unwrap<{ expiresAt: string }>(
    apiClient.post<ApiSuccess<{ expiresAt: string }>>("/api/auth/student/otp/send", {
      phone,
      purpose,
    }),
  );
}

/** Verifies the code and returns the accessToken to hand to verifyStudentPhone
 *  or forgotPasswordStudent — the same slot MSG91's token used to fill. */
export async function verifyStudentOtp(phone: string, purpose: OtpPurpose, code: string) {
  const { accessToken } = await unwrap<{ accessToken: string }>(
    apiClient.post<ApiSuccess<{ accessToken: string }>>("/api/auth/student/otp/verify", {
      phone,
      purpose,
      code,
    }),
  );
  return accessToken;
}

export function verifyStudentPhone(accessToken: string) {
  return unwrap<StudentUser>(
    authedRequest<ApiSuccess<StudentUser>>("STUDENT", {
      method: "POST",
      url: "/api/auth/student/verify-phone",
      data: { accessToken },
    }),
  );
}

// Public (no auth): the verified OTP access token proves ownership of the phone,
// so the BE resets that student's password to newPassword.
export function forgotPasswordStudent(phone: string, accessToken: string, newPassword: string) {
  return unwrap<null>(
    apiClient.post<ApiSuccess<null>>("/api/auth/student/forgot-password", {
      phone,
      accessToken,
      newPassword,
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
