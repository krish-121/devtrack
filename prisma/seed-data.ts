import { randomBytes } from 'node:crypto';
import { hash } from 'argon2';
import type { PrismaClient } from '../apps/api/src/generated/prisma/client.js';
import {
  TaskPriority,
  TaskStatus,
} from '../apps/api/src/generated/prisma/enums.js';

const demoUserId = '11111111-1111-4111-8111-111111111111';
const harnessProjectId = '22222222-2222-4222-8222-222222222222';
const portfolioProjectId = '33333333-3333-4333-8333-333333333333';

export async function seedDevelopmentData(client: PrismaClient) {
  // There is no demo login in Phase 2. Discard the random password; store only
  // its standard Argon2id hash, ready for the later authentication phase.
  const passwordHash = await hash(randomBytes(32));

  await client.$transaction(async (transaction) => {
    await transaction.user.upsert({
      where: { id: demoUserId },
      update: {},
      create: {
        id: demoUserId,
        name: 'Demo User',
        email: 'demo@devtrack.example'.trim().toLowerCase(),
        passwordHash,
      },
    });

    for (const project of [
      {
        id: harnessProjectId,
        name: 'Harness Project',
        description: 'Learn how code moves through a delivery pipeline.',
      },
      {
        id: portfolioProjectId,
        name: 'Portfolio Project',
        description: 'Present the application and explain its architecture.',
      },
    ]) {
      await transaction.project.upsert({
        where: { id: project.id },
        update: {},
        create: { ...project, ownerId: demoUserId },
      });
    }

    for (const task of [
      {
        id: '44444444-4444-4444-8444-444444444441',
        projectId: harnessProjectId,
        title: 'Configure GitHub connector',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        dueDate: null,
      },
      {
        id: '44444444-4444-4444-8444-444444444442',
        projectId: harnessProjectId,
        title: 'Add CI pipeline',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: new Date('2026-10-20T12:00:00.000Z'),
      },
      {
        id: '44444444-4444-4444-8444-444444444443',
        projectId: harnessProjectId,
        title: 'Deploy to Cloud Run',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date('2026-10-25T12:00:00.000Z'),
      },
      {
        id: '44444444-4444-4444-8444-444444444444',
        projectId: portfolioProjectId,
        title: 'Add project screenshot',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        dueDate: null,
      },
      {
        id: '44444444-4444-4444-8444-444444444445',
        projectId: portfolioProjectId,
        title: 'Write README',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: null,
      },
    ]) {
      await transaction.task.upsert({
        where: { id: task.id },
        update: {},
        create: task,
      });
    }
  });
}
