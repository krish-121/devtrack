import { beforeEach, expect, it, vi } from 'vitest';
import * as repository from './task.repository.js';
import { findProject } from '../projects/project.repository.js';
import * as service from './task.service.js';

vi.mock('./task.repository.js');
vi.mock('../projects/project.repository.js');
const task = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  projectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  title: 'Release',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: null,
  createdAt: new Date('2026-10-24T00:00:00Z'),
  updatedAt: new Date('2026-10-24T00:00:00Z'),
} satisfies NonNullable<Awaited<ReturnType<typeof repository.findTask>>>;
beforeEach(() => {
  vi.resetAllMocks();
});
it('does not list tasks or leak existence when the parent is unavailable', async () => {
  vi.mocked(findProject).mockResolvedValue(null);
  await expect(
    service.listTasks('owner', task.projectId, {}),
  ).rejects.toMatchObject({ statusCode: 404, code: 'PROJECT_NOT_FOUND' });
  expect(repository.listTasks).not.toHaveBeenCalled();
});
it('forwards filters and ownership and serializes nullable UTC dates', async () => {
  vi.mocked(findProject).mockResolvedValue({
    id: task.projectId,
    name: 'Project',
    description: null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  });
  vi.mocked(repository.listTasks).mockResolvedValue([
    task,
    { ...task, dueDate: new Date('2026-10-30T00:00:00Z') },
  ]);
  const data = await service.listTasks('owner', task.projectId, {
    q: 'Release',
    priority: 'HIGH',
  });
  expect(repository.listTasks).toHaveBeenCalledWith('owner', task.projectId, {
    q: 'Release',
    priority: 'HIGH',
  });
  expect(data[0]?.dueDate).toBeNull();
  expect(data[1]?.dueDate).toBe('2026-10-30T00:00:00.000Z');
});
it('reads and creates owned tasks as public DTOs', async () => {
  vi.mocked(repository.findTask).mockResolvedValue(task);
  vi.mocked(repository.createTask).mockResolvedValue(task);
  expect(await service.getTask('owner', task.id)).toMatchObject({
    createdAt: '2026-10-24T00:00:00.000Z',
  });
  await service.createTask('owner', task.projectId, { title: 'Release' });
  expect(repository.createTask).toHaveBeenCalledWith('owner', task.projectId, {
    title: 'Release',
  });
});
it('preserves PATCH omissions and explicit nulls', async () => {
  vi.mocked(repository.updateTask).mockResolvedValue(task);
  await service.updateTask('owner', task.id, { dueDate: null });
  expect(repository.updateTask).toHaveBeenCalledWith('owner', task.id, {
    dueDate: null,
  });
});
it('returns missing task/parent errors for unavailable records', async () => {
  vi.mocked(repository.findTask).mockResolvedValue(null);
  vi.mocked(repository.createTask).mockResolvedValue(null);
  vi.mocked(repository.updateTask).mockResolvedValue(null);
  await expect(service.getTask('owner', task.id)).rejects.toMatchObject({
    code: 'TASK_NOT_FOUND',
    statusCode: 404,
  });
  await expect(
    service.createTask('owner', task.projectId, { title: 'Release' }),
  ).rejects.toMatchObject({ code: 'PROJECT_NOT_FOUND', statusCode: 404 });
  await expect(
    service.updateTask('owner', task.id, { status: 'DONE' }),
  ).rejects.toMatchObject({ code: 'TASK_NOT_FOUND', statusCode: 404 });
});
it('distinguishes a missing deletion from a successful one', async () => {
  vi.mocked(repository.deleteTask)
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(true);
  await expect(service.deleteTask('owner', task.id)).rejects.toMatchObject({
    code: 'TASK_NOT_FOUND',
    statusCode: 404,
  });
  await expect(service.deleteTask('owner', task.id)).resolves.toBeUndefined();
});
