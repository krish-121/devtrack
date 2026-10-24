import type {
  ProjectInput,
  ProjectResponse,
  ProjectsResponse,
  UpdateProjectInput,
} from '@devtrack/shared';
import type { Request, Response } from 'express';
import * as service from './project.service.js';

type ProjectLocals = { ownerId: string; projectId: string };

export async function listProjects(
  _request: Request,
  response: Response<ProjectsResponse, ProjectLocals>,
) {
  response.json({ data: await service.listProjects(response.locals.ownerId) });
}

export async function getProject(
  _request: Request,
  response: Response<ProjectResponse, ProjectLocals>,
) {
  response.json({
    data: await service.getProject(
      response.locals.ownerId,
      response.locals.projectId,
    ),
  });
}

export async function createProject(
  _request: Request,
  response: Response<ProjectResponse, ProjectLocals & { body: ProjectInput }>,
) {
  const project = await service.createProject(
    response.locals.ownerId,
    response.locals.body,
  );
  response
    .location(`/api/v1/projects/${project.id}`)
    .status(201)
    .json({ data: project });
}

export async function updateProject(
  _request: Request,
  response: Response<
    ProjectResponse,
    ProjectLocals & { body: UpdateProjectInput }
  >,
) {
  response.json({
    data: await service.updateProject(
      response.locals.ownerId,
      response.locals.projectId,
      response.locals.body,
    ),
  });
}

export async function deleteProject(
  _request: Request,
  response: Response<never, ProjectLocals>,
) {
  await service.deleteProject(
    response.locals.ownerId,
    response.locals.projectId,
  );
  response.status(204).end();
}
