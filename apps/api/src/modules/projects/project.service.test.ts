import { beforeEach, expect, it, vi } from 'vitest';
import * as repository from './project.repository.js';
import * as service from './project.service.js';
import { toProjectDtos } from './project.mapper.js';

vi.mock('./project.repository.js');
const record = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Portfolio',
  description: null,
  createdAt: new Date('2026-10-24T00:00:00Z'),
  updatedAt: new Date('2026-10-24T01:00:00Z'),
};
beforeEach(() => {
  vi.resetAllMocks();
});

it('calculates rounded progress, zero progress and UTC DTOs without leaking records', () => {
  expect(
    toProjectDtos(
      [record],
      [
        { projectId: record.id, status: 'TODO', _count: { _all: 2 } },
        { projectId: record.id, status: 'IN_PROGRESS', _count: { _all: 3 } },
        { projectId: record.id, status: 'DONE', _count: { _all: 2 } },
      ],
    )[0],
  ).toMatchObject({
    taskCount: 7,
    completedTaskCount: 2,
    progress: 29,
    updatedAt: '2026-10-24T01:00:00.000Z',
  });
  expect(toProjectDtos([record], [])[0]).toMatchObject({
    taskCount: 0,
    completedTaskCount: 0,
    progress: 0,
  });
});
it('lists projects using owner-scoped grouped counts', async () => {
  vi.mocked(repository.listProjects).mockResolvedValue([record]);
  vi.mocked(repository.countTasksByStatus).mockResolvedValue([]);
  expect(await service.listProjects('owner')).toHaveLength(1);
  expect(repository.countTasksByStatus).toHaveBeenCalledWith('owner', [
    record.id,
  ]);
});
it('returns only the requested owned project', async () => {
  vi.mocked(repository.findProject).mockResolvedValue(record);
  vi.mocked(repository.countTasksByStatus).mockResolvedValue([]);
  expect(await service.getProject('owner', record.id)).toMatchObject({
    id: record.id,
    progress: 0,
  });
  expect(repository.findProject).toHaveBeenCalledWith('owner', record.id);
});
it('passes ownership and input through create and update without inventing fields', async () => {
  vi.mocked(repository.createProject).mockResolvedValue(record);
  vi.mocked(repository.updateProject).mockResolvedValue(record);
  vi.mocked(repository.countTasksByStatus).mockResolvedValue([]);
  await service.createProject('owner', { name: record.name });
  await service.updateProject('owner', record.id, { description: null });
  expect(repository.createProject).toHaveBeenCalledWith('owner', {
    name: record.name,
  });
  expect(repository.updateProject).toHaveBeenCalledWith('owner', record.id, {
    description: null,
  });
});
it('returns the same missing-project error for reads and updates without aggregating', async () => {
  vi.mocked(repository.findProject).mockResolvedValue(null);
  vi.mocked(repository.updateProject).mockResolvedValue(null);
  await expect(service.getProject('owner', record.id)).rejects.toMatchObject({
    statusCode: 404,
    code: 'PROJECT_NOT_FOUND',
  });
  await expect(
    service.updateProject('owner', record.id, { name: 'Changed' }),
  ).rejects.toMatchObject({ statusCode: 404 });
  expect(repository.countTasksByStatus).not.toHaveBeenCalled();
});
it('reports deletion of a missing project and permits successful deletion', async () => {
  vi.mocked(repository.deleteProject)
    .mockResolvedValueOnce({ count: 0 })
    .mockResolvedValueOnce({ count: 1 });
  await expect(service.deleteProject('owner', record.id)).rejects.toMatchObject(
    { statusCode: 404 },
  );
  await expect(
    service.deleteProject('owner', record.id),
  ).resolves.toBeUndefined();
});
