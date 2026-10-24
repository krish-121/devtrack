import { z } from 'zod';

export const healthResponseSchema = z.object({
  data: z.object({ status: z.literal('ok') }),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const versionResponseSchema = z.object({
  data: z.object({ version: z.string() }),
});
export type VersionResponse = z.infer<typeof versionResponseSchema>;

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
};
