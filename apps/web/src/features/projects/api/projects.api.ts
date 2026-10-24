import type { ProjectInput, UpdateProjectInput } from '@devtrack/shared';
import {
  projectResponseSchema,
  projectsResponseSchema,
} from '@devtrack/shared';
import { apiClient } from '../../../lib/api/client';

const projectPath = (id: string) => `/projects/${encodeURIComponent(id)}`;

export const projectsApi = {
  async list() {
    return (await apiClient.request('/projects', projectsResponseSchema)).data;
  },
  async get(id: string) {
    return (await apiClient.request(projectPath(id), projectResponseSchema))
      .data;
  },
  async create(input: ProjectInput) {
    return (
      await apiClient.request('/projects', projectResponseSchema, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ).data;
  },
  async update(id: string, input: UpdateProjectInput) {
    return (
      await apiClient.request(projectPath(id), projectResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
    ).data;
  },
  remove(id: string) {
    return apiClient.remove(projectPath(id));
  },
};
