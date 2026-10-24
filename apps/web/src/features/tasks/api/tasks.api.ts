import { taskResponseSchema, tasksResponseSchema } from '@devtrack/shared';
import type {
  CreateTaskInput,
  TaskFilters,
  UpdateTaskInput,
} from '@devtrack/shared';
import { apiClient } from '../../../lib/api/client';

export const tasksApi = {
  async list(projectId: string, filters: TaskFilters) {
    const query = new URLSearchParams();
    if (filters.status) query.set('status', filters.status);
    if (filters.priority) query.set('priority', filters.priority);
    if (filters.q) query.set('q', filters.q);
    return (
      await apiClient.request(
        `/projects/${encodeURIComponent(projectId)}/tasks?${query}`,
        tasksResponseSchema,
      )
    ).data;
  },
  async get(id: string) {
    return (
      await apiClient.request(
        `/tasks/${encodeURIComponent(id)}`,
        taskResponseSchema,
      )
    ).data;
  },
  async create(projectId: string, input: CreateTaskInput) {
    return (
      await apiClient.request(
        `/projects/${encodeURIComponent(projectId)}/tasks`,
        taskResponseSchema,
        { method: 'POST', body: JSON.stringify(input) },
      )
    ).data;
  },
  async update(id: string, input: UpdateTaskInput) {
    return (
      await apiClient.request(
        `/tasks/${encodeURIComponent(id)}`,
        taskResponseSchema,
        { method: 'PATCH', body: JSON.stringify(input) },
      )
    ).data;
  },
  remove(id: string) {
    return apiClient.remove(`/tasks/${encodeURIComponent(id)}`);
  },
};
