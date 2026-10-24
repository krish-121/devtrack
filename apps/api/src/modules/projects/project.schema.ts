import { z } from 'zod';

export const createProjectSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, 'Project name is required.')
    .max(120, 'Use 120 characters or fewer.'),
  description: z
    .string()
    .trim()
    .max(2000, 'Use 2000 characters or fewer.')
    .nullable()
    .optional(),
});

export const updateProjectSchema = createProjectSchema
  .partial()
  .refine(
    (input) => Object.keys(input).length > 0,
    'Provide at least one project field.',
  );

export const projectParamsSchema = z.object({
  projectId: z.uuid('Project ID must be a UUID.'),
});
