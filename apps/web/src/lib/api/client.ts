import { z } from 'zod';

const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.string()).optional(),
  }),
});

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function send(path: string, options: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Cannot reach DevTrack. Check your connection and try again.',
    );
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const parsed = errorSchema.safeParse(body);
    if (
      path !== '/auth/me' &&
      parsed.success &&
      response.status === 401 &&
      parsed.data.error.code === 'UNAUTHORIZED'
    )
      window.dispatchEvent(new Event('devtrack:unauthorized'));
    if (parsed.success)
      throw new ApiError(
        response.status,
        parsed.data.error.code,
        parsed.data.error.message,
        parsed.data.error.details,
      );
    throw new ApiError(
      response.status,
      'REQUEST_FAILED',
      'The request failed. Please try again.',
    );
  }
  return response;
}

export const apiClient = {
  async request<T>(
    path: string,
    schema: z.ZodType<T>,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await send(path, options);
    const body: unknown = await response.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      throw new ApiError(
        response.status,
        'INVALID_RESPONSE',
        'DevTrack returned an unexpected response. Please try again.',
      );
    return parsed.data;
  },
  async remove(path: string): Promise<void> {
    await send(path, { method: 'DELETE' });
  },
  async noContent(path: string, options: RequestInit): Promise<void> {
    await send(path, options);
  },
};
