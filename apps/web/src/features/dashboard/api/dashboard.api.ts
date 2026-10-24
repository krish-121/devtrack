import { dashboardResponseSchema } from '@devtrack/shared';
import { apiClient } from '../../../lib/api/client';

export const dashboardApi = {
  async summary() {
    return (
      await apiClient.request('/dashboard/summary', dashboardResponseSchema)
    ).data;
  },
};
