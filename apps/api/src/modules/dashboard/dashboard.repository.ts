import { prisma } from '../../database/prisma.js';
import { Prisma } from '../../generated/prisma/client.js';
import { projectSelect } from '../projects/project.repository.js';

export function getDashboardData(ownerId: string) {
  // A stable snapshot keeps cards and recent progress consistent during writes.
  // Four bounded queries; never one extra query per project or a full task load.
  return prisma.$transaction(
    async (transaction) => {
      const activeProjectCount = await transaction.project.count({
        where: { ownerId },
      });
      const statusCounts = await transaction.task.groupBy({
        by: ['status'],
        where: { project: { ownerId } },
        _count: { _all: true },
      });
      const recentProjects = await transaction.project.findMany({
        where: { ownerId },
        select: projectSelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        take: 5,
      });
      const projectCounts = await transaction.task.groupBy({
        by: ['projectId', 'status'],
        where: {
          project: { ownerId },
          projectId: { in: recentProjects.map((project) => project.id) },
        },
        _count: { _all: true },
      });
      return {
        activeProjectCount,
        statusCounts,
        recentProjects,
        projectCounts,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}
