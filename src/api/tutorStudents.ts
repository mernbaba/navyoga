import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type Paginated,
  type TutorStudentItem,
  type Role,
} from "./types";

export type TutorStudentsParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export function getTutorStudents(role: Role, params: TutorStudentsParams = {}) {
  return unwrap<Paginated<TutorStudentItem>>(
    authedRequest<ApiSuccess<Paginated<TutorStudentItem>>>(role, {
      method: "GET",
      url: "/api/auth/tutor/me/students",
      params,
    }),
  );
}
