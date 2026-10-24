import { z } from 'zod';

export type ProjectInput = {
  name: string;
  description?: string | null;
};

export type UpdateProjectInput = Partial<ProjectInput>;

export const projectSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  taskCount: z.number().int().nonnegative(),
  completedTaskCount: z.number().int().nonnegative(),
  progress: z.number().min(0).max(100),
});
export const projectResponseSchema = z.object({ data: projectSchema });
export const projectsResponseSchema = z.object({
  data: z.array(projectSchema),
});
export type ProjectDto = z.infer<typeof projectSchema>;
export type ProjectResponse = z.infer<typeof projectResponseSchema>;
export type ProjectsResponse = z.infer<typeof projectsResponseSchema>;
