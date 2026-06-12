import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type Lead,
  type LeadSource,
  type LeadStatus,
  type Paginated,
  type Role,
} from "./types";

export type LeadListParams = {
  q?: string;
  status?: LeadStatus;
  source?: LeadSource;
  assignedToId?: string;
  page?: number;
  limit?: number;
};

export type LeadCreateBody = {
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  page?: string;
  interest: string;
  location?: string;
  status?: LeadStatus;
  lastContactDate?: string;
  notes?: string;
  assignedToId?: string;
};

export type LeadUpdateBody = Partial<Omit<LeadCreateBody, "location" | "lastContactDate" | "notes" | "assignedToId" | "page">> & {
  page?: string | null;
  location?: string | null;
  lastContactDate?: string | null;
  notes?: string | null;
  assignedToId?: string | null;
};

export function listLeads(role: Role, params: LeadListParams = {}) {
  return unwrap<Paginated<Lead>>(
    authedRequest<ApiSuccess<Paginated<Lead>>>(role, {
      method: "GET",
      url: "/api/leads",
      params,
    }),
  );
}

export type LeadStatsParams = {
  source?: LeadSource;
  assignedToId?: string;
};

export type LeadStats = {
  total: number;
  byStatus: Record<LeadStatus, number>;
  new: number;
  contacted: number;
  interested: number;
  converted: number;
  notInterested: number;
};

export function getLeadStats(role: Role, params: LeadStatsParams = {}) {
  return unwrap<LeadStats>(
    authedRequest<ApiSuccess<LeadStats>>(role, {
      method: "GET",
      url: "/api/leads/stats",
      params,
    }),
  );
}

export function getLead(role: Role, id: string) {
  return unwrap<Lead>(
    authedRequest<ApiSuccess<Lead>>(role, {
      method: "GET",
      url: `/api/leads/${id}`,
    }),
  );
}

export function createLead(role: Role, body: LeadCreateBody) {
  return unwrap<Lead>(
    authedRequest<ApiSuccess<Lead>>(role, {
      method: "POST",
      url: "/api/leads",
      data: body,
    }),
  );
}

export function updateLead(role: Role, id: string, body: LeadUpdateBody) {
  return unwrap<Lead>(
    authedRequest<ApiSuccess<Lead>>(role, {
      method: "PATCH",
      url: `/api/leads/${id}`,
      data: body,
    }),
  );
}

export function deleteLead(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `/api/leads/${id}`,
    }),
  );
}

