import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { projectTaskRouter } from '../tasks/task.routes.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as controller from './project.controller.js';
import {
  createProjectSchema,
  projectParamsSchema,
  updateProjectSchema,
} from './project.schema.js';

export const projectRouter = Router();
projectRouter.use(requireAuth);
projectRouter.param('projectId', (request, response, next) => {
  response.locals.projectId = projectParamsSchema.parse(
    request.params,
  ).projectId;
  next();
});
projectRouter.get('/', controller.listProjects);
projectRouter.post(
  '/',
  validateBody(createProjectSchema),
  controller.createProject,
);
projectRouter.get('/:projectId', controller.getProject);
projectRouter.patch(
  '/:projectId',
  validateBody(updateProjectSchema),
  controller.updateProject,
);
projectRouter.delete('/:projectId', controller.deleteProject);
projectRouter.use('/:projectId/tasks', projectTaskRouter);
