import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import { deleteTestUsers, registerTestUser } from '../../../test/auth.js';

let agent: ReturnType<typeof request.agent>;
let otherAgent: ReturnType<typeof request.agent>;
let projectId = '';
let ownerId = '';
let otherOwnerId = '';
const tasks = () => `/api/v1/projects/${projectId}/tasks`;
describe('authenticated tasks', () => {
  beforeEach(async () => {
    const first = await registerTestUser();
    const second = await registerTestUser();
    agent = first.agent;
    otherAgent = second.agent;
    ownerId = first.user.id;
    otherOwnerId = second.user.id;
    projectId = (
      await prisma.project.create({
        data: {
          ownerId,
          name: 'Task integration',
          updatedAt: new Date('2020-01-01'),
        },
      })
    ).id;
  });
  afterEach(async () => {
    await deleteTestUsers([ownerId, otherOwnerId]);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates, reads, edits and deletes a task with defaults, UTC dates and project progress refresh', async () => {
    await agent.get(tasks()).expect(200, { data: [] });
    const created = await agent
      .post(tasks())
      .send({ title: '  Learn task flow  ' })
      .expect(201);
    const task = await prisma.task.findFirstOrThrow({ where: { projectId } });
    expect(created.headers.location).toBe(`/api/v1/tasks/${task.id}`);
    expect(created.body).toMatchObject({
      data: {
        id: task.id,
        title: 'Learn task flow',
        description: null,
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: null,
      },
    });
    await agent.get(`/api/v1/tasks/${task.id}`).expect(200, created.body);
    const updated = await agent
      .patch(`/api/v1/tasks/${task.id}`)
      .send({
        description: 'Explain the flow',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: '2026-10-24T12:30:00+05:30',
      })
      .expect(200);
    expect(updated.body).toMatchObject({
      data: {
        title: 'Learn task flow',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: '2026-10-24T07:00:00.000Z',
      },
    });
    const project = await agent
      .get(`/api/v1/projects/${projectId}`)
      .expect(200);
    expect(project.body).toMatchObject({
      data: { taskCount: 1, completedTaskCount: 1, progress: 100 },
    });
    expect(
      (
        await prisma.project.findUniqueOrThrow({ where: { id: projectId } })
      ).updatedAt.getTime(),
    ).toBeGreaterThan(new Date('2020-01-01').getTime());
    await agent
      .patch(`/api/v1/tasks/${task.id}`)
      .send({ dueDate: null, description: null })
      .expect(200);
    expect(
      await prisma.task.findUniqueOrThrow({ where: { id: task.id } }),
    ).toMatchObject({ dueDate: null, description: null });
    await agent.delete(`/api/v1/tasks/${task.id}`).expect(204);
    expect(await prisma.task.count({ where: { projectId } })).toBe(0);
    await agent.get(`/api/v1/tasks/${task.id}`).expect(404);
    const empty = await agent.get(`/api/v1/projects/${projectId}`).expect(200);
    expect(empty.body).toMatchObject({ data: { taskCount: 0, progress: 0 } });
  });

  it('filters by status, priority and literal case-insensitive title/description text together', async () => {
    await prisma.task.createMany({
      data: [
        {
          projectId,
          title: 'Harness CI',
          description: 'Validate code',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
        },
        { projectId, title: 'Harness docs', status: 'TODO', priority: 'LOW' },
        {
          projectId,
          title: 'Other',
          description: 'Learn HARNESS',
          status: 'DONE',
          priority: 'HIGH',
        },
        {
          projectId,
          title: '100%_literal',
          status: 'TODO',
          priority: 'MEDIUM',
        },
      ],
    });
    const response = await agent
      .get(tasks())
      .query({ status: 'IN_PROGRESS', priority: 'HIGH', q: 'hArNeSs' })
      .expect(200);
    expect(response.body).toMatchObject({ data: [{ title: 'Harness CI' }] });
    const description = await agent
      .get(tasks())
      .query({ q: 'learn harness' })
      .expect(200);
    expect(description.body).toMatchObject({ data: [{ title: 'Other' }] });
    const literal = await agent.get(tasks()).query({ q: '%_' }).expect(200);
    expect(literal.body).toMatchObject({ data: [{ title: '100%_literal' }] });
    await agent
      .get(tasks())
      .query({ q: "'; DROP TABLE Task; --" })
      .expect(200, { data: [] });
    expect(await prisma.task.count({ where: { projectId } })).toBe(4);
  });

  it('prevents a second authenticated user reading or changing projects and tasks', async () => {
    const task = await prisma.task.create({
      data: { projectId, title: 'Private task' },
    });
    await otherAgent.get(tasks()).expect(404);
    await otherAgent.post(tasks()).send({ title: 'Stolen' }).expect(404);
    await otherAgent.get(`/api/v1/projects/${projectId}`).expect(404);
    await otherAgent
      .patch(`/api/v1/projects/${projectId}`)
      .send({ name: 'Stolen' })
      .expect(404);
    await otherAgent.delete(`/api/v1/projects/${projectId}`).expect(404);
    await otherAgent.get(`/api/v1/tasks/${task.id}`).expect(404);
    await otherAgent
      .patch(`/api/v1/tasks/${task.id}`)
      .send({ status: 'DONE' })
      .expect(404);
    await otherAgent.delete(`/api/v1/tasks/${task.id}`).expect(404);
    expect(
      await prisma.task.findUniqueOrThrow({ where: { id: task.id } }),
    ).toHaveProperty('status', 'TODO');
    await request(app).get(tasks()).expect(401);
    await request(app).post(tasks()).send({ title: 'Anonymous' }).expect(401);
    await request(app).get(`/api/v1/tasks/${task.id}`).expect(401);
    await request(app)
      .patch(`/api/v1/tasks/${task.id}`)
      .send({ title: 'Anonymous' })
      .expect(401);
    await request(app).delete(`/api/v1/tasks/${task.id}`).expect(401);
  });

  it('rejects invalid bodies, IDs, enum values and filter arrays without writes', async () => {
    for (const body of [
      {},
      { title: ' ' },
      { title: 'x'.repeat(201) },
      { title: 'Valid', status: 'UNKNOWN' },
      { title: 'Valid', priority: 'URGENT' },
      { title: 'Valid', dueDate: '2026-02-30T00:00:00Z' },
      { title: 'Valid', dueDate: 'tomorrow' },
      { title: 'Valid', projectId: randomUUID() },
      { title: 'Valid', description: 'x'.repeat(5001) },
    ])
      await agent.post(tasks()).send(body).expect(400);
    for (const query of [
      { status: 'UNKNOWN' },
      { priority: 'URGENT' },
      { q: ['a', 'b'] },
      { q: 'x'.repeat(201) },
      { ownerId },
    ])
      await agent.get(tasks()).query(query).expect(400);
    await agent.get('/api/v1/tasks/not-a-uuid').expect(400);
    await agent
      .post(`/api/v1/projects/${randomUUID()}/tasks`)
      .send({ title: 'Missing project' })
      .expect(404);
    const task = await prisma.task.create({
      data: { projectId, title: 'Keep' },
    });
    for (const body of [
      {},
      { title: '' },
      { ownerId },
      { projectId: randomUUID() },
      { status: null },
    ])
      await agent.patch(`/api/v1/tasks/${task.id}`).send(body).expect(400);
    await agent
      .patch(`/api/v1/tasks/${randomUUID()}`)
      .send({ title: 'Missing' })
      .expect(404);
    await agent.delete(`/api/v1/tasks/${randomUUID()}`).expect(404);
    expect(await prisma.task.count({ where: { projectId } })).toBe(1);
  });
});
