import type {
  CreateTaskInput,
  TaskDto,
  TaskFilters,
  UpdateTaskInput,
} from '@devtrack/shared';
import type { Task } from '../../generated/prisma/client.js';
import { AppError } from '../../errors/app-error.js';
import { findProject } from '../projects/project.repository.js';
import * as repository from './task.repository.js';

function toDto(task: Task): TaskDto {
  return {
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
function missingTask() {
  return new AppError(404, 'TASK_NOT_FOUND', 'Task not found.');
}
export async function listTasks(
  ownerId: string,
  projectId: string,
  filters: TaskFilters,
) {
  if (!(await findProject(ownerId, projectId)))
    throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found.');
  return (await repository.listTasks(ownerId, projectId, filters)).map(toDto);
}
export async function getTask(ownerId: string, id: string) {
  const task = await repository.findTask(ownerId, id);
  if (!task) throw missingTask();
  return toDto(task);
}
export async function createTask(
  ownerId: string,
  projectId: string,
  input: CreateTaskInput,
) {
  const task = await repository.createTask(ownerId, projectId, input);
  if (!task) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found.');
  return toDto(task);
}
export async function updateTask(
  ownerId: string,
  id: string,
  input: UpdateTaskInput,
) {
  const task = await repository.updateTask(ownerId, id, input);
  if (!task) throw missingTask();
  return toDto(task);
}
export async function deleteTask(ownerId: string, id: string) {
  if (!(await repository.deleteTask(ownerId, id))) throw missingTask();
}
