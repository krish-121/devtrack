import { Router } from 'express';
import { z } from 'zod';
import {
  createTaskSchema,
  taskFilterSchema,
  updateTaskSchema,
} from '@devtrack/shared';
import { requireAuth } from '../../middleware/require-auth.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as controller from './task.controller.js';

// Mounted below the already authenticated project router, whose parameter
// middleware supplies projectId. Individual task routes authenticate separately.
export const projectTaskRouter = Router();
projectTaskRouter.get(
  '/',
  (request, response, next) => {
    response.locals.filters = taskFilterSchema.parse(request.query);
    next();
  },
  controller.listTasks,
);
projectTaskRouter.post(
  '/',
  validateBody(createTaskSchema),
  controller.createTask,
);

export const taskRouter = Router();
taskRouter.use(requireAuth);
const paramsSchema = z.object({ taskId: z.uuid('Task ID must be a UUID.') });
taskRouter.param('taskId', (request, response, next) => {
  response.locals.taskId = paramsSchema.parse(request.params).taskId;
  next();
});
taskRouter.get('/:taskId', controller.getTask);
taskRouter.patch(
  '/:taskId',
  validateBody(updateTaskSchema),
  controller.updateTask,
);
taskRouter.delete('/:taskId', controller.deleteTask);
