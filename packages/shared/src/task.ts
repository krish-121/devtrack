import { z } from 'zod';

export const taskStatuses = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export const taskPriorities = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const taskStatusSchema = z.enum(taskStatuses);
export const taskPrioritySchema = z.enum(taskPriorities);
export const createTaskSchema = z.strictObject({
  title: z
    .string()
    .trim()
    .min(1, 'Task title is required.')
    .max(200, 'Use 200 characters or fewer.'),
  description: z
    .string()
    .trim()
    .max(5000, 'Use 5000 characters or fewer.')
    .nullable()
    .optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: z.iso.datetime({ offset: true }).nullable().optional(),
});
export const updateTaskSchema = createTaskSchema
  .partial()
  .refine(
    (input) => Object.keys(input).length > 0,
    'Provide at least one task field.',
  );
export const taskFilterSchema = z.strictObject({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  q: z.string().trim().max(200).optional(),
});
export const taskSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const taskResponseSchema = z.object({ data: taskSchema });
export const tasksResponseSchema = z.object({ data: z.array(taskSchema) });
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilters = z.infer<typeof taskFilterSchema>;
export type TaskDto = z.infer<typeof taskSchema>;
export type TaskResponse = z.infer<typeof taskResponseSchema>;
export type TasksResponse = z.infer<typeof tasksResponseSchema>;
