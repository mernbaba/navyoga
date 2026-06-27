import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type Paginated,
  type Role,
  type TutorAssignedClass,
} from "./types";

export type TutorClassesStatusFilter = "current" | "live" | "upcoming" | "past";

export type TutorClassesParams = {
  page?: number;
  limit?: number;
  status?: TutorClassesStatusFilter;
};

export function listTutorClasses(role: Role, params: TutorClassesParams = {}) {
  return unwrap<Paginated<TutorAssignedClass>>(
    authedRequest<ApiSuccess<Paginated<TutorAssignedClass>>>(role, {
      method: "GET",
      url: "/api/classes/tutor",
      params,
    }),
  );
}
