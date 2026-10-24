import { expect, it, vi } from 'vitest';
import { getDashboardData } from './dashboard.repository.js';
import { getDashboardSummary } from './dashboard.service.js';

vi.mock('./dashboard.repository.js');
it('fills every absent status with zero for an empty account', async () => {
  vi.mocked(getDashboardData).mockResolvedValue({
    activeProjectCount: 0,
    statusCounts: [],
    recentProjects: [],
    projectCounts: [],
  });
  expect(await getDashboardSummary('owner')).toEqual({
    activeProjectCount: 0,
    openTaskCount: 0,
    completedTaskCount: 0,
    tasksByStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
    recentProjects: [],
  });
  expect(getDashboardData).toHaveBeenCalledWith('owner');
});
it('combines open statuses while reusing rounded project progress', async () => {
  vi.mocked(getDashboardData).mockResolvedValue({
    activeProjectCount: 6,
    statusCounts: [
      { status: 'TODO', _count: { _all: 4 } },
      { status: 'IN_PROGRESS', _count: { _all: 2 } },
      { status: 'DONE', _count: { _all: 3 } },
    ],
    recentProjects: [
      {
        id: 'project',
        name: 'Recent',
        description: null,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      },
    ],
    projectCounts: [
      { projectId: 'project', status: 'TODO', _count: { _all: 2 } },
      { projectId: 'project', status: 'DONE', _count: { _all: 1 } },
    ],
  });
  const summary = await getDashboardSummary('owner');
  expect(summary).toMatchObject({
    activeProjectCount: 6,
    openTaskCount: 6,
    completedTaskCount: 3,
  });
  expect(summary.recentProjects[0]).toMatchObject({
    taskCount: 3,
    completedTaskCount: 1,
    progress: 33,
  });
});
