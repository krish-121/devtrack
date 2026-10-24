import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());
export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.').max(128),
});
export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(1, 'Name is required.').max(120),
  password: z
    .string()
    .min(12, 'Use at least 12 characters.')
    .max(128, 'Use 128 characters or fewer.'),
});
export const userSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
});
export const userResponseSchema = z.object({ data: userSchema });
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UserDto = z.infer<typeof userSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
