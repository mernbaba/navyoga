import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type Paginated,
  type Role,
  type StaffStatus,
  type Tutor,
} from "./types";

export type TutorListParams = {
  q?: string;
  status?: StaffStatus;
  page?: number;
  limit?: number;
};

export type TutorCreateBody = {
  email: string;
  name: string;
  phone: string;
  password: string;
  experience: number;
  specializations?: string[];
  bio?: string;
  avatar?: string;
  referredByCode?: string;
};

export type TutorUpdateBody = Partial<Omit<TutorCreateBody, "password" | "avatar" | "bio">> & {
  avatar?: string | null;
  bio?: string | null;
  status?: StaffStatus;
};

export function listTutors(role: Role, params: TutorListParams = {}) {
  return unwrap<Paginated<Tutor>>(
    authedRequest<ApiSuccess<Paginated<Tutor>>>(role, {
      method: "GET",
      url: "/api/tutors",
      params,
    }),
  );
}

export function getTutor(role: Role, id: string) {
  return unwrap<Tutor>(
    authedRequest<ApiSuccess<Tutor>>(role, {
      method: "GET",
      url: `/api/tutors/${id}`,
    }),
  );
}

export function createTutor(role: Role, body: TutorCreateBody) {
  return unwrap<Tutor>(
    authedRequest<ApiSuccess<Tutor>>(role, {
      method: "POST",
      url: "/api/tutors",
      data: body,
    }),
  );
}

export function updateTutor(role: Role, id: string, body: TutorUpdateBody) {
  return unwrap<Tutor>(
    authedRequest<ApiSuccess<Tutor>>(role, {
      method: "PATCH",
      url: `/api/tutors/${id}`,
      data: body,
    }),
  );
}

export function deleteTutor(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `/api/tutors/${id}`,
    }),
  );
}
