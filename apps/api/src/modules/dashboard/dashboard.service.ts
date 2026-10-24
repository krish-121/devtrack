import type { DashboardSummary } from '@devtrack/shared';
import { toProjectDtos } from '../projects/project.mapper.js';
import { getDashboardData } from './dashboard.repository.js';

export async function getDashboardSummary(
  ownerId: string,
): Promise<DashboardSummary> {
  const data = await getDashboardData(ownerId);
  const tasksByStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  for (const group of data.statusCounts)
    tasksByStatus[group.status] = group._count._all;
  return {
    activeProjectCount: data.activeProjectCount,
    openTaskCount: tasksByStatus.TODO + tasksByStatus.IN_PROGRESS,
    completedTaskCount: tasksByStatus.DONE,
    tasksByStatus,
    recentProjects: toProjectDtos(data.recentProjects, data.projectCounts),
  };
}
