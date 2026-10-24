import { userResponseSchema } from '@devtrack/shared';
import type { LoginInput, RegisterInput } from '@devtrack/shared';
import { apiClient, ApiError } from '../../../lib/api/client';

export const authApi = {
  async me() {
    try {
      return (await apiClient.request('/auth/me', userResponseSchema)).data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  async login(input: LoginInput) {
    return (
      await apiClient.request('/auth/login', userResponseSchema, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ).data;
  },
  async register(input: RegisterInput) {
    return (
      await apiClient.request('/auth/register', userResponseSchema, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ).data;
  },
  logout() {
    return apiClient.noContent('/auth/logout', { method: 'POST', body: '{}' });
  },
};
