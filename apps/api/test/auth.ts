import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/database/prisma.js';

export const testPassword = 'A long test passphrase 123';
export async function registerTestUser() {
  const email = `${randomUUID()}@auth.test`;
  const agent = request.agent(app);
  const response = await agent
    .post('/api/v1/auth/register')
    .send({ name: 'Test User', email, password: testPassword })
    .expect(201);
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  return { user, agent, response };
}
export async function deleteTestUsers(ids: string[]) {
  await prisma.project.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}
