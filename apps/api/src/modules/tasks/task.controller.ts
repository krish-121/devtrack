import type {
  CreateTaskInput,
  TaskFilters,
  TaskResponse,
  TasksResponse,
  UpdateTaskInput,
} from '@devtrack/shared';
import type { Request, Response } from 'express';
import * as service from './task.service.js';

type TaskLocals = {
  ownerId: string;
  projectId: string;
  taskId: string;
  filters: TaskFilters;
};
export async function listTasks(
  _request: Request,
  response: Response<TasksResponse, TaskLocals>,
) {
  response.json({
    data: await service.listTasks(
      response.locals.ownerId,
      response.locals.projectId,
      response.locals.filters,
    ),
  });
}
export async function getTask(
  _request: Request,
  response: Response<TaskResponse, TaskLocals>,
) {
  response.json({
    data: await service.getTask(
      response.locals.ownerId,
      response.locals.taskId,
    ),
  });
}
export async function createTask(
  _request: Request,
  response: Response<TaskResponse, TaskLocals & { body: CreateTaskInput }>,
) {
  const task = await service.createTask(
    response.locals.ownerId,
    response.locals.projectId,
    response.locals.body,
  );
  response
    .location(`/api/v1/tasks/${task.id}`)
    .status(201)
    .json({ data: task });
}
export async function updateTask(
  _request: Request,
  response: Response<TaskResponse, TaskLocals & { body: UpdateTaskInput }>,
) {
  response.json({
    data: await service.updateTask(
      response.locals.ownerId,
      response.locals.taskId,
      response.locals.body,
    ),
  });
}
export async function deleteTask(
  _request: Request,
  response: Response<never, TaskLocals>,
) {
  await service.deleteTask(response.locals.ownerId, response.locals.taskId);
  response.status(204).end();
}
