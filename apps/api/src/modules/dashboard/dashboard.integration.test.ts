import request from 'supertest';
import { dashboardResponseSchema } from '@devtrack/shared';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { deleteTestUsers, registerTestUser } from '../../../test/auth.js';

let ownerId = '';
let otherOwnerId = '';
let agent: ReturnType<typeof request.agent>;
let otherAgent: ReturnType<typeof request.agent>;
const endpoint = '/api/v1/dashboard/summary';
const empty = {
  activeProjectCount: 0,
  openTaskCount: 0,
  completedTaskCount: 0,
  tasksByStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
  recentProjects: [],
};

describe('authenticated dashboard summary', () => {
  beforeEach(async () => {
    const first = await registerTestUser();
    const second = await registerTestUser();
    ownerId = first.user.id;
    otherOwnerId = second.user.id;
    agent = first.agent;
    otherAgent = second.agent;
  });
  afterEach(async () => {
    await deleteTestUsers([ownerId, otherOwnerId]);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('requires a real session and returns meaningful zero counts for an empty account', async () => {
    await request(app).get(endpoint).set('x-user-id', ownerId).expect(401);
    const response = await agent.get(endpoint).expect(200, { data: empty });
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('counts only owned data and returns the same project progress as project endpoints', async () => {
    const project = await prisma.project.create({
      data: {
        ownerId,
        name: 'Owner project',
        tasks: {
          create: [
            { title: 'Next' },
            { title: 'Working', status: 'IN_PROGRESS' },
            { title: 'Complete', status: 'DONE' },
          ],
        },
      },
    });
    await prisma.project.create({ data: { ownerId, name: 'Empty project' } });
    await prisma.project.create({
      data: {
        ownerId: otherOwnerId,
        name: 'Foreign project',
        tasks: {
          create: [
            { title: 'Foreign done', status: 'DONE' },
            { title: 'Foreign next' },
          ],
        },
      },
    });
    const summary = dashboardResponseSchema.parse(
      (await agent.get(endpoint).query({ ownerId: otherOwnerId }).expect(200))
        .body,
    ).data;
    expect(summary).toMatchObject({
      activeProjectCount: 2,
      openTaskCount: 2,
      completedTaskCount: 1,
      tasksByStatus: { TODO: 1, IN_PROGRESS: 1, DONE: 1 },
    });
    expect(summary.recentProjects.map((item) => item.name)).not.toContain(
      'Foreign project',
    );
    const detail = await agent
      .get(`/api/v1/projects/${project.id}`)
      .expect(200);
    expect(detail.body).toEqual({
      data: summary.recentProjects.find((item) => item.id === project.id),
    });
    const other = dashboardResponseSchema.parse(
      (await otherAgent.get(endpoint).expect(200)).body,
    ).data;
    expect(other).toMatchObject({
      activeProjectCount: 1,
      openTaskCount: 1,
      completedTaskCount: 1,
    });
  });

  it('limits recent projects to five in activity order but includes older tasks in totals', async () => {
    const ids: string[] = [];
    for (let index = 0; index < 7; index++) {
      const project = await prisma.project.create({
        data: {
          ownerId,
          name: `Project ${index}`,
          updatedAt: new Date(`2020-01-0${index + 1}T00:00:00Z`),
          tasks: { create: { title: 'Complete', status: 'DONE' } },
        },
      });
      ids.push(project.id);
    }
    const summary = dashboardResponseSchema.parse(
      (await agent.get(endpoint).expect(200)).body,
    ).data;
    expect(summary.activeProjectCount).toBe(7);
    expect(summary.completedTaskCount).toBe(7);
    expect(summary.recentProjects.map((project) => project.id)).toEqual(
      ids.slice(2).reverse(),
    );
    expect(
      summary.recentProjects.every((project) => project.progress === 100),
    ).toBe(true);
  });

  it('reflects task status changes, deletion cascades and project activity without stale server counts', async () => {
    const old = await prisma.project.create({
      data: { ownerId, name: 'Old', updatedAt: new Date('2020-01-01') },
    });
    await prisma.project.create({
      data: { ownerId, name: 'Newer', updatedAt: new Date('2021-01-01') },
    });
    await agent
      .post(`/api/v1/projects/${old.id}/tasks`)
      .send({ title: 'Finish slice' })
      .expect(201);
    const task = await prisma.task.findFirstOrThrow({
      where: { projectId: old.id },
    });
    await agent
      .patch(`/api/v1/tasks/${task.id}`)
      .send({ status: 'DONE' })
      .expect(200);
    const changed = dashboardResponseSchema.parse(
      (await agent.get(endpoint).expect(200)).body,
    ).data;
    expect(changed).toMatchObject({
      openTaskCount: 0,
      completedTaskCount: 1,
      tasksByStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 1 },
    });
    expect(changed.recentProjects[0]).toMatchObject({
      id: old.id,
      progress: 100,
    });
    await agent.delete(`/api/v1/projects/${old.id}`).expect(204);
    const deleted = dashboardResponseSchema.parse(
      (await agent.get(endpoint).expect(200)).body,
    ).data;
    expect(deleted).toMatchObject({
      activeProjectCount: 1,
      openTaskCount: 0,
      completedTaskCount: 0,
    });
    expect(
      deleted.recentProjects.some((project) => project.id === old.id),
    ).toBe(false);
  });
});
