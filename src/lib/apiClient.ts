import axios, { type AxiosRequestConfig } from "axios";
import type { LoginRole } from "../components/auth/RoleLoginPage";
import { getRoleToken } from "./auth";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001").trim();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function authedRequest<T = unknown>(role: LoginRole, config: AxiosRequestConfig) {
  const token = getRoleToken(role);
  return apiClient.request<T>({
    ...config,
    headers: {
      ...config.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
