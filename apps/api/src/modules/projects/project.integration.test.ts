import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../app.js';
import { registerTestUser } from '../../../test/auth.js';
import { prisma } from '../../database/prisma.js';

let ownerId = '';
let otherOwnerId = '';
let agent: ReturnType<typeof request.agent>;
const base = '/api/v1/projects';

describe('project HTTP and database slice', () => {
  beforeEach(async () => {
    const first = await registerTestUser();
    const second = await registerTestUser();
    ownerId = first.user.id;
    otherOwnerId = second.user.id;
    agent = first.agent;
  });
  afterEach(async () => {
    await prisma.project.deleteMany({
      where: { ownerId: { in: [ownerId, otherOwnerId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, otherOwnerId] } },
    });
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates, lists, reads, updates and deletes a persisted project', async () => {
    await agent.get(base).expect(200, { data: [] });
    const created = await agent
      .post(base)
      .send({ name: '  Learning project  ', description: '  First slice  ' })
      .expect(201);
    const stored = await prisma.project.findFirstOrThrow({
      where: { ownerId },
    });
    expect(created.headers.location).toBe(`${base}/${stored.id}`);
    const dto = {
      id: stored.id,
      name: 'Learning project',
      description: 'First slice',
      createdAt: stored.createdAt.toISOString(),
      updatedAt: stored.updatedAt.toISOString(),
      taskCount: 0,
      completedTaskCount: 0,
      progress: 0,
    };
    expect(created.body).toEqual({ data: dto });
    await agent.get(base).expect(200, { data: [dto] });
    await agent.get(`${base}/${stored.id}`).expect(200, { data: dto });
    const updated = await agent
      .patch(`${base}/${stored.id}`)
      .send({ name: 'Updated project', description: null })
      .expect(200);
    expect(updated.body).toMatchObject({
      data: { name: 'Updated project', description: null },
    });
    expect(
      await prisma.project.findUniqueOrThrow({ where: { id: stored.id } }),
    ).toMatchObject({ name: 'Updated project', description: null, ownerId });
    await agent.delete(`${base}/${stored.id}`).expect(204, '');
    expect(
      await prisma.project.findUnique({ where: { id: stored.id } }),
    ).toBeNull();
    await agent.get(`${base}/${stored.id}`).expect(404);
    await agent.delete(`${base}/${stored.id}`).expect(404);
  });

  it('computes real progress and cascades deletion to tasks', async () => {
    const project = await prisma.project.create({
      data: {
        ownerId,
        name: 'With tasks',
        tasks: {
          create: [
            { title: 'Complete', status: 'DONE' },
            { title: 'Working', status: 'IN_PROGRESS' },
            { title: 'Next', status: 'TODO' },
          ],
        },
      },
    });
    const response = await agent.get(`${base}/${project.id}`).expect(200);
    expect(response.body).toMatchObject({
      data: { taskCount: 3, completedTaskCount: 1, progress: 33 },
    });
    const list = await agent.get(base).expect(200);
    expect(list.body).toMatchObject({
      data: [{ taskCount: 3, completedTaskCount: 1, progress: 33 }],
    });
    await agent.delete(`${base}/${project.id}`).expect(204);
    expect(await prisma.task.count({ where: { projectId: project.id } })).toBe(
      0,
    );
  });

  it('hides another owner’s projects and refuses reads, updates, deletes and identity spoofing', async () => {
    const other = await prisma.project.create({
      data: { ownerId: otherOwnerId, name: 'Private project' },
    });
    await agent
      .get(base)
      .set('x-user-id', otherOwnerId)
      .query({ ownerId: otherOwnerId })
      .expect(200, { data: [] });
    const notFound = {
      error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' },
    };
    await agent.get(`${base}/${other.id}`).expect(404, notFound);
    await agent
      .patch(`${base}/${other.id}`)
      .send({ name: 'Stolen' })
      .expect(404, notFound);
    await agent.delete(`${base}/${other.id}`).expect(404, notFound);
    await agent
      .post(base)
      .send({ name: 'Spoofed', ownerId: otherOwnerId })
      .expect(400);
    expect(
      await prisma.project.findUniqueOrThrow({ where: { id: other.id } }),
    ).toHaveProperty('name', 'Private project');
  });

  it.each([
    {},
    { name: '' },
    { name: '   ' },
    { name: null },
    { name: 12 },
    { name: 'x'.repeat(121) },
    { name: 'Valid', description: 'x'.repeat(2001) },
    { name: 'Valid', extra: true },
  ])('rejects invalid creation input %j without writing', async (body) => {
    const response = await agent.post(base).send(body).expect(400);
    expect(response.body).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(await prisma.project.count({ where: { ownerId } })).toBe(0);
  });

  it('rejects empty/invalid updates, malformed IDs, malformed JSON and oversized input', async () => {
    const project = await prisma.project.create({
      data: { ownerId, name: 'Unchanged', description: 'Keep this' },
    });
    for (const body of [{}, { name: ' ' }, { ownerId: otherOwnerId }])
      await agent.patch(`${base}/${project.id}`).send(body).expect(400);
    await agent.get(`${base}/bad-id`).expect(400);
    await agent.patch(`${base}/bad-id`).send({ name: 'Valid' }).expect(400);
    await agent.delete(`${base}/bad-id`).expect(400);
    await agent
      .post(base)
      .set('Content-Type', 'application/json')
      .send('{')
      .expect(400, {
        error: {
          code: 'INVALID_JSON',
          message: 'Request body must be valid JSON.',
        },
      });
    await agent
      .post(base)
      .send({ name: 'x'.repeat(20_000) })
      .expect(413);
    await agent
      .patch(`${base}/${project.id}`)
      .send({ name: 'Only name' })
      .expect(200);
    expect(
      await prisma.project.findUniqueOrThrow({ where: { id: project.id } }),
    ).toMatchObject({ name: 'Only name', description: 'Keep this' });
    await agent
      .patch(`${base}/${randomUUID()}`)
      .send({ name: 'Missing' })
      .expect(404);
  });

  it('requires authentication for project requests', async () => {
    await request(app).get(base).expect(401);
    await request(app).post(base).send({ name: 'No session' }).expect(401);
    await request(app)
      .patch(`${base}/${randomUUID()}`)
      .send({ name: 'No session' })
      .expect(401);
    await request(app).delete(`${base}/${randomUUID()}`).expect(401);
  });
});
