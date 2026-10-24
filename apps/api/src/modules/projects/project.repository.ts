import type { ProjectInput, UpdateProjectInput } from '@devtrack/shared';
import { prisma } from '../../database/prisma.js';
import { Prisma } from '../../generated/prisma/client.js';

// Task records never leave this layer; progress uses database aggregates.
export const projectSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

export type ProjectRecord = Prisma.ProjectGetPayload<{
  select: typeof projectSelect;
}>;

export function listProjects(ownerId: string) {
  return prisma.project.findMany({
    where: { ownerId },
    select: projectSelect,
    orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
  });
}

export function findProject(ownerId: string, id: string) {
  return prisma.project.findFirst({
    where: { id, ownerId },
    select: projectSelect,
  });
}

export function countTasksByStatus(ownerId: string, projectIds: string[]) {
  return prisma.task.groupBy({
    by: ['projectId', 'status'],
    where: {
      projectId: { in: projectIds },
      project: { ownerId },
    },
    _count: { _all: true },
  });
}

export function createProject(ownerId: string, input: ProjectInput) {
  return prisma.project.create({
    data: { ...input, ownerId },
    select: projectSelect,
  });
}

export async function updateProject(
  ownerId: string,
  id: string,
  input: UpdateProjectInput,
) {
  try {
    return await prisma.project.update({
      where: { id, ownerId },
      data: input,
      select: projectSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    )
      return null;
    throw error;
  }
}

export function deleteProject(ownerId: string, id: string) {
  return prisma.project.deleteMany({ where: { id, ownerId } });
}
