import { z } from 'zod';
import { projectSchema } from './project.js';
import { taskStatusSchema } from './task.js';

export const dashboardSchema = z.object({
  activeProjectCount: z.number().int().nonnegative(),
  openTaskCount: z.number().int().nonnegative(),
  completedTaskCount: z.number().int().nonnegative(),
  tasksByStatus: z.record(taskStatusSchema, z.number().int().nonnegative()),
  recentProjects: z.array(projectSchema).max(5),
});
export const dashboardResponseSchema = z.object({ data: dashboardSchema });
export type DashboardSummary = z.infer<typeof dashboardSchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
