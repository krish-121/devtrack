import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TaskPriority, TaskStatus } from '../generated/prisma/enums.js';
import { prisma } from './prisma.js';

describe('database foundation', () => {
  let userId = randomUUID();
  let projectId = randomUUID();
  let duplicateUserId = randomUUID();
  let email = '';

  beforeEach(async () => {
    userId = randomUUID();
    projectId = randomUUID();
    duplicateUserId = randomUUID();
    email = `database-test-${userId}@example.com`;

    await prisma.user.create({
      data: {
        id: userId,
        name: 'Database Test User',
        email,
        passwordHash: '!disabled:test',
        projects: {
          create: { id: projectId, name: 'Database Test Project' },
        },
      },
    });
  });

  afterEach(async () => {
    // Only remove this test's records; project deletion also removes its tasks.
    await prisma.project.deleteMany({
      where: { OR: [{ ownerId: userId }, { id: projectId }] },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userId, duplicateUserId] } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('persists the ownership chain with generated IDs, timestamps, and task defaults', async () => {
    const task = await prisma.task.create({
      data: { projectId, title: 'Learn the database relationships' },
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { projects: { include: { tasks: true } } },
    });

    expect(task.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(task).toMatchObject({
      projectId,
      title: 'Learn the database relationships',
      description: null,
      dueDate: null,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    });
    expect(user).toMatchObject({
      email,
      projects: [
        {
          id: projectId,
          ownerId: userId,
          description: null,
          tasks: [task],
        },
      ],
    });
    for (const record of [user, ...user.projects, task]) {
      expect(record.createdAt).toBeInstanceOf(Date);
      expect(record.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('rejects another user with the same email', async () => {
    await expect(
      prisma.user.create({
        data: {
          id: duplicateUserId,
          name: 'Duplicate Email User',
          email,
          passwordHash: '!disabled:test',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });

    expect(await prisma.user.count({ where: { email } })).toBe(1);
  });

  it('rejects email values that were not normalized before persistence', async () => {
    // Raw SQL exercises the database constraint, independently of Prisma types.
    await expect(
      prisma.$executeRaw`
        UPDATE "User" SET "email" = ${email.toUpperCase()}
        WHERE "id" = ${userId}::uuid
      `,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`
        UPDATE "User" SET "email" = ${` ${email} `}
        WHERE "id" = ${userId}::uuid
      `,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`
        UPDATE "User" SET "email" = ${''}
        WHERE "id" = ${userId}::uuid
      `,
    ).rejects.toThrow();

    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    ).toHaveProperty('email', email);
  });

  it('rejects references to a missing owner or project', async () => {
    const task = await prisma.task.create({
      data: { projectId, title: 'A task must belong to a project' },
    });

    await expect(
      prisma.project.update({
        where: { id: projectId },
        data: { ownerId: randomUUID() },
      }),
    ).rejects.toMatchObject({ code: 'P2003' });
    await expect(
      prisma.task.update({
        where: { id: task.id },
        data: { projectId: randomUUID() },
      }),
    ).rejects.toMatchObject({ code: 'P2003' });

    expect(
      await prisma.project.findUniqueOrThrow({ where: { id: projectId } }),
    ).toHaveProperty('ownerId', userId);
    expect(
      await prisma.task.findUniqueOrThrow({ where: { id: task.id } }),
    ).toHaveProperty('projectId', projectId);
  });

  it('requires project ownership, task membership, and names at the database boundary', async () => {
    const task = await prisma.task.create({
      data: { projectId, title: 'Required task title' },
    });

    await expect(
      prisma.$executeRaw`
        UPDATE "Project" SET "ownerId" = NULL WHERE "id" = ${projectId}::uuid
      `,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`
        UPDATE "Task" SET "projectId" = NULL WHERE "id" = ${task.id}::uuid
      `,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`
        UPDATE "Project" SET "name" = NULL WHERE "id" = ${projectId}::uuid
      `,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`
        UPDATE "Task" SET "title" = NULL WHERE "id" = ${task.id}::uuid
      `,
    ).rejects.toThrow();
  });

  it('rejects blank names, task titles, and password hashes', async () => {
    const task = await prisma.task.create({
      data: { projectId, title: 'Nonblank task title' },
    });

    await expect(
      prisma.$executeRaw`
        UPDATE "User" SET "name" = ${'   '} WHERE "id" = ${userId}::uuid
      `,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`
        UPDATE "User" SET "passwordHash" = ${'   '} WHERE "id" = ${userId}::uuid
      `,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`
        UPDATE "Project" SET "name" = ${'   '} WHERE "id" = ${projectId}::uuid
      `,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`
        UPDATE "Task" SET "title" = ${'   '} WHERE "id" = ${task.id}::uuid
      `,
    ).rejects.toThrow();
  });

  it('rejects unknown status and priority values', async () => {
    const task = await prisma.task.create({
      data: { projectId, title: 'Only known enum values are allowed' },
    });

    await expect(
      prisma.$executeRaw`
        UPDATE "Task" SET "status" = ${'BLOCKED'}::"TaskStatus"
        WHERE "id" = ${task.id}::uuid
      `,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`
        UPDATE "Task" SET "priority" = ${'URGENT'}::"TaskPriority"
        WHERE "id" = ${task.id}::uuid
      `,
    ).rejects.toThrow();

    expect(
      await prisma.task.findUniqueOrThrow({ where: { id: task.id } }),
    ).toMatchObject({ status: TaskStatus.TODO, priority: TaskPriority.MEDIUM });
  });

  it('restricts deleting an owner and cascades project deletion to its tasks', async () => {
    const task = await prisma.task.create({
      data: {
        projectId,
        title: 'A task is deleted with its project',
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
      },
    });

    await expect(
      prisma.user.delete({ where: { id: userId } }),
    ).rejects.toMatchObject({ code: 'P2003' });
    expect(
      await prisma.task.findUnique({ where: { id: task.id } }),
    ).not.toBeNull();

    await prisma.project.delete({ where: { id: projectId } });

    expect(await prisma.task.findUnique({ where: { id: task.id } })).toBeNull();
    expect(
      await prisma.user.findUnique({ where: { id: userId } }),
    ).not.toBeNull();
  });

  it('preserves a due-date instant when given a timezone offset', async () => {
    const task = await prisma.task.create({
      data: {
        projectId,
        title: 'Review the database design',
        description: 'Explain the relationships and constraints.',
        dueDate: new Date('2026-10-10T12:30:00+05:30'),
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
      },
    });
    const storedTask = await prisma.task.findUniqueOrThrow({
      where: { id: task.id },
    });

    expect(storedTask.dueDate?.toISOString()).toBe('2026-10-10T07:00:00.000Z');
    expect(storedTask).toMatchObject({
      description: 'Explain the relationships and constraints.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
    });
  });

  it('rolls back all writes when a transaction fails', async () => {
    const rolledBackProjectId = randomUUID();
    const rolledBackTaskId = randomUUID();

    await expect(
      prisma.$transaction(async (transaction) => {
        await transaction.project.create({
          data: {
            id: rolledBackProjectId,
            ownerId: userId,
            name: 'This project must roll back',
          },
        });
        await transaction.task.create({
          data: {
            id: rolledBackTaskId,
            projectId: rolledBackProjectId,
            title: 'This task must roll back too',
          },
        });
        throw new Error('Abort this test transaction');
      }),
    ).rejects.toThrow('Abort this test transaction');

    expect(
      await prisma.project.findUnique({ where: { id: rolledBackProjectId } }),
    ).toBeNull();
    expect(
      await prisma.task.findUnique({ where: { id: rolledBackTaskId } }),
    ).toBeNull();
    expect(
      await prisma.project.findUnique({ where: { id: projectId } }),
    ).not.toBeNull();
  });
});
