import { randomUUID } from 'node:crypto';
import { afterAll, expect, it } from 'vitest';
import { seedDevelopmentData } from '../../../../prisma/seed-data.js';
import { prisma } from './prisma.js';

afterAll(async () => {
  await prisma.$disconnect();
});

it('can seed twice without duplicating records or overwriting existing work', async () => {
  const unrelatedId = randomUUID();
  let demoUserId: string | undefined;

  try {
    await prisma.user.create({
      data: {
        id: unrelatedId,
        name: 'Unrelated user',
        email: `${unrelatedId}@example.test`,
        passwordHash: '!disabled:test',
      },
    });
    await seedDevelopmentData(prisma);

    const demo = await prisma.user.findUniqueOrThrow({
      where: { email: 'demo@devtrack.example' },
      include: { projects: { include: { tasks: true } } },
    });
    demoUserId = demo.id;
    expect(demo.projects).toHaveLength(2);
    expect(demo.projects.flatMap((project) => project.tasks)).toHaveLength(5);

    const task = await prisma.task.findFirstOrThrow({
      where: { project: { ownerId: demo.id } },
    });
    await prisma.task.update({
      where: { id: task.id },
      data: { title: 'My edited task', status: 'DONE' },
    });
    await seedDevelopmentData(prisma);

    expect(await prisma.user.count({ where: { id: demo.id } })).toBe(1);
    expect(await prisma.project.count({ where: { ownerId: demo.id } })).toBe(2);
    expect(
      await prisma.task.count({ where: { project: { ownerId: demo.id } } }),
    ).toBe(5);
    expect(
      await prisma.task.findUniqueOrThrow({ where: { id: task.id } }),
    ).toMatchObject({ title: 'My edited task', status: 'DONE' });
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: demo.id } }),
    ).toHaveProperty('passwordHash', demo.passwordHash);
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: unrelatedId } }),
    ).toHaveProperty('name', 'Unrelated user');
  } finally {
    if (demoUserId) {
      await prisma.project.deleteMany({ where: { ownerId: demoUserId } });
      await prisma.user.deleteMany({ where: { id: demoUserId } });
    }
    await prisma.user.deleteMany({ where: { id: unrelatedId } });
  }
});
