import { authedRequest } from "../lib/apiClient";
import { unwrap, type ApiSuccess, type TutorDashboardStats, type Role } from "./types";

export function getTutorDashboard(role: Role) {
  return unwrap<TutorDashboardStats>(
    authedRequest<ApiSuccess<TutorDashboardStats>>(role, {
      method: "GET",
      url: "/api/dashboard/tutor",
    }),
  );
}
