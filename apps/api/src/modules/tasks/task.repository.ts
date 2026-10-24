import type {
  CreateTaskInput,
  TaskFilters,
  UpdateTaskInput,
} from '@devtrack/shared';
import { prisma } from '../../database/prisma.js';

function taskChanges(input: UpdateTaskInput) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
  };
}

export function listTasks(
  ownerId: string,
  projectId: string,
  filters: TaskFilters,
) {
  const text = filters.q?.replace(/[\\%_]/g, '\\$&');
  return prisma.task.findMany({
    where: {
      projectId,
      project: { ownerId },
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(text
        ? {
            OR: [
              { title: { contains: text, mode: 'insensitive' } },
              { description: { contains: text, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
}
export function findTask(ownerId: string, id: string) {
  return prisma.task.findFirst({ where: { id, project: { ownerId } } });
}
export function createTask(
  ownerId: string,
  projectId: string,
  input: CreateTaskInput,
) {
  return prisma.$transaction(async (transaction) => {
    // Lock/check the owned parent and update its activity date in the same
    // transaction as the task write, including when another request deletes it.
    const parent = await transaction.project.updateMany({
      where: { id: projectId, ownerId },
      data: { updatedAt: new Date() },
    });
    if (!parent.count) return null;
    return transaction.task.create({
      data: { ...taskChanges(input), title: input.title, projectId },
    });
  });
}
export function updateTask(
  ownerId: string,
  id: string,
  input: UpdateTaskInput,
) {
  return prisma.$transaction(async (transaction) => {
    const task = await transaction.task.findFirst({
      where: { id, project: { ownerId } },
      select: { projectId: true },
    });
    if (!task) return null;
    const parent = await transaction.project.updateMany({
      where: { id: task.projectId, ownerId },
      data: { updatedAt: new Date() },
    });
    if (!parent.count) return null;
    const [updated] = await transaction.task.updateManyAndReturn({
      where: { id, project: { ownerId } },
      data: taskChanges(input),
    });
    return updated ?? null;
  });
}
export function deleteTask(ownerId: string, id: string) {
  return prisma.$transaction(async (transaction) => {
    const task = await transaction.task.findFirst({
      where: { id, project: { ownerId } },
      select: { projectId: true },
    });
    if (!task) return false;
    const parent = await transaction.project.updateMany({
      where: { id: task.projectId, ownerId },
      data: { updatedAt: new Date() },
    });
    if (!parent.count) return false;
    const result = await transaction.task.deleteMany({
      where: { id, project: { ownerId } },
    });
    return result.count > 0;
  });
}
