import type { ProjectDto } from '@devtrack/shared';
import type {
  countTasksByStatus,
  ProjectRecord,
} from './project.repository.js';

// Both project endpoints and dashboard use this one public progress calculation.
export function toProjectDtos(
  records: ProjectRecord[],
  groups: Awaited<ReturnType<typeof countTasksByStatus>>,
): ProjectDto[] {
  const counts = new Map<string, { total: number; completed: number }>();
  for (const group of groups) {
    const count = counts.get(group.projectId) ?? { total: 0, completed: 0 };
    count.total += group._count._all;
    if (group.status === 'DONE') count.completed += group._count._all;
    counts.set(group.projectId, count);
  }
  return records.map((record) => {
    const taskCount = counts.get(record.id)?.total ?? 0;
    const completedTaskCount = counts.get(record.id)?.completed ?? 0;
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      taskCount,
      completedTaskCount,
      progress: taskCount
        ? Math.round((completedTaskCount / taskCount) * 100)
        : 0,
    };
  });
}
