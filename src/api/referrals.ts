import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type MyReferralStudentItem,
  type MyReferralTutorItem,
  type MyStudentReferralsResponse,
  type MyTutorReferralsResponse,
  type Paginated,
  type ReferralOverview,
  type ReferralStatus,
  type Role,
  type StudentReferralRow,
  type TutorReferralRow,
} from "./types";

export type ReferralListParams = {
  q?: string;
  status?: ReferralStatus;
  page?: number;
  limit?: number;
};

export type MyReferralListParams = {
  page?: number;
  limit?: number;
};

export function getSuperadminUserOverview(role: Role) {
  return unwrap<ReferralOverview>(
    authedRequest<ApiSuccess<ReferralOverview>>(role, {
      method: "GET",
      url: "/api/referrals/user/overview",
    }),
  );
}

export function listSuperadminUserReferrals(role: Role, params: ReferralListParams = {}) {
  return unwrap<Paginated<StudentReferralRow>>(
    authedRequest<ApiSuccess<Paginated<StudentReferralRow>>>(role, {
      method: "GET",
      url: "/api/referrals/user",
      params,
    }),
  );
}

export function getSuperadminTutorOverview(role: Role) {
  return unwrap<ReferralOverview>(
    authedRequest<ApiSuccess<ReferralOverview>>(role, {
      method: "GET",
      url: "/api/referrals/tutor/overview",
    }),
  );
}

export function listSuperadminTutorReferrals(role: Role, params: ReferralListParams = {}) {
  return unwrap<Paginated<TutorReferralRow>>(
    authedRequest<ApiSuccess<Paginated<TutorReferralRow>>>(role, {
      method: "GET",
      url: "/api/referrals/tutor",
      params,
    }),
  );
}

export function getMyTutorUserReferrals(role: Role, params: MyReferralListParams = {}) {
  return unwrap<MyTutorReferralsResponse<MyReferralStudentItem>>(
    authedRequest<ApiSuccess<MyTutorReferralsResponse<MyReferralStudentItem>>>(role, {
      method: "GET",
      url: "/api/referrals/me/users",
      params,
    }),
  );
}

export function getMyTutorTutorReferrals(role: Role, params: MyReferralListParams = {}) {
  return unwrap<MyTutorReferralsResponse<MyReferralTutorItem>>(
    authedRequest<ApiSuccess<MyTutorReferralsResponse<MyReferralTutorItem>>>(role, {
      method: "GET",
      url: "/api/referrals/me/tutors",
      params,
    }),
  );
}

export function getMyStudentReferrals(role: Role, params: MyReferralListParams = {}) {
  return unwrap<MyStudentReferralsResponse>(
    authedRequest<ApiSuccess<MyStudentReferralsResponse>>(role, {
      method: "GET",
      url: "/api/referrals/me",
      params,
    }),
  );
}
