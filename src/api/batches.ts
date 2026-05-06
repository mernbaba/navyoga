import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type Paginated,
  type Role,
  type Batch,
} from "./types";

export type BatchListParams = {
  q?: string;
  page?: number;
  limit?: number;
};

export function listBatches(role: Role, params: BatchListParams = {}) {
  return unwrap<Paginated<Batch>>(
    authedRequest<ApiSuccess<Paginated<Batch>>>(role, {
      method: "GET",
      url: "/api/batches",
      params,
    }),
  );
}

export function getBatch(role: Role, id: string) {
  return unwrap<Batch>(
    authedRequest<ApiSuccess<Batch>>(role, {
      method: "GET",
      url: `/api/batches/${id}`,
    }),
  );
}

export function createBatch(role: Role, name: string) {
  return unwrap<Batch>(
    authedRequest<ApiSuccess<Batch>>(role, {
      method: "POST",
      url: "/api/batches",
      data: { name },
    }),
  );
}

export function renameBatch(role: Role, id: string, name: string) {
  return unwrap<Batch>(
    authedRequest<ApiSuccess<Batch>>(role, {
      method: "PATCH",
      url: `/api/batches/${id}`,
      data: { name },
    }),
  );
}

export function deleteBatch(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `/api/batches/${id}`,
    }),
  );
}
