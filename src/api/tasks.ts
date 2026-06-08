import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type DailyTask,
  type Paginated,
  type Role,
  type TaskCategory,
  type TaskPriority,
  type TaskStatus,
} from "./types";

export type TaskListParams = {
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  assignedToId?: string;
  page?: number;
  limit?: number;
};

export type TaskCreateBody = {
  title: string;
  category: TaskCategory;
  date?: string;
  dueDate?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
};

export type TaskUpdateBody = {
  title?: string;
  category?: TaskCategory;
  date?: string;
  dueDate?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
};

export function listTasks(role: Role, params: TaskListParams = {}) {
  return unwrap<Paginated<DailyTask>>(
    authedRequest<ApiSuccess<Paginated<DailyTask>>>(role, {
      method: "GET",
      url: "/api/tasks",
      params,
    }),
  );
}

export function getTask(role: Role, id: string) {
  return unwrap<DailyTask>(
    authedRequest<ApiSuccess<DailyTask>>(role, {
      method: "GET",
      url: `/api/tasks/${id}`,
    }),
  );
}

export function createTask(role: Role, body: TaskCreateBody) {
  return unwrap<DailyTask>(
    authedRequest<ApiSuccess<DailyTask>>(role, {
      method: "POST",
      url: "/api/tasks",
      data: body,
    }),
  );
}

export function updateTask(role: Role, id: string, body: TaskUpdateBody) {
  return unwrap<DailyTask>(
    authedRequest<ApiSuccess<DailyTask>>(role, {
      method: "PATCH",
      url: `/api/tasks/${id}`,
      data: body,
    }),
  );
}

export function deleteTask(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `/api/tasks/${id}`,
    }),
  );
}
