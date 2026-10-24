import { createHash, randomUUID } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { verify } from 'argon2';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { app } from '../../app.js';
import { prisma } from '../../database/prisma.js';
import {
  deleteTestUsers,
  registerTestUser,
  testPassword,
} from '../../../test/auth.js';
import { createAuthRateLimit } from './auth.rate-limit.js';

const ids: string[] = [];
afterEach(async () => {
  await deleteTestUsers(ids);
  ids.length = 0;
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe('authentication', () => {
  it('registers with an Argon2id password hash, safe DTO and HttpOnly cookie; logout revokes the session', async () => {
    const { user, agent, response } = await registerTestUser();
    ids.push(user.id);
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    expect(await verify(user.passwordHash, testPassword)).toBe(true);
    expect(response.body).toEqual({
      data: { id: user.id, name: user.name, email: user.email },
    });
    const cookieHeader = response.headers['set-cookie'];
    if (!Array.isArray(cookieHeader) || typeof cookieHeader[0] !== 'string')
      throw new Error('Expected a session cookie.');
    const cookie = cookieHeader[0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=604800');
    const token = cookie.match(/^devtrack_session=([a-f0-9]{64});/)?.[1];
    if (!token) throw new Error('Expected a 256-bit opaque token.');
    const stored = await prisma.session.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(stored.tokenHash).toBe(
      createHash('sha256').update(token).digest('hex'),
    );
    expect(stored.tokenHash).not.toBe(token);
    await agent.get('/api/v1/auth/me').expect(200, response.body);
    const logout = await agent.post('/api/v1/auth/logout').send({}).expect(204);
    expect(logout.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Expires=Thu, 01 Jan 1970'),
      ]),
    );
    await agent.get('/api/v1/auth/me').expect(401);
    await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `devtrack_session=${token}`)
      .expect(401);
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
    await agent.post('/api/v1/auth/logout').send({}).expect(204);
  });

  it('normalizes email and logs in with a fresh cookie, rejecting duplicates and incorrect credentials', async () => {
    const { user, agent } = await registerTestUser();
    ids.push(user.id);
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate',
        email: ` ${user.email.toUpperCase()} `,
        password: testPassword,
      })
      .expect(409);
    await agent.post('/api/v1/auth/logout').send({}).expect(204);
    await agent
      .post('/api/v1/auth/login')
      .send({ email: ` ${user.email.toUpperCase()} `, password: testPassword })
      .expect(200);
    await agent.get('/api/v1/auth/me').expect(200);
    const invalid = {
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect.',
      },
    };
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'wrong password' })
      .expect(401, invalid);
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: `${randomUUID()}@missing.test`, password: testPassword })
      .expect(401, invalid);
  });

  it('rotates a previous session on login and rejects expired, tampered and malformed cookies', async () => {
    const { user, agent, response } = await registerTestUser();
    ids.push(user.id);
    const previous = response.headers['set-cookie'];
    if (!Array.isArray(previous) || typeof previous[0] !== 'string')
      throw new Error('Expected cookie.');
    const originalCookie = previous[0].split(';')[0];
    if (!originalCookie) throw new Error('Expected cookie.');
    await agent
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: testPassword })
      .expect(200);
    await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', originalCookie)
      .expect(401);
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: {
        createdAt: new Date(Date.now() - 120000),
        expiresAt: new Date(Date.now() - 60000),
      },
    });
    await agent.get('/api/v1/auth/me').expect(401);
    for (const token of ['invalid', '%ZZ', 'a'.repeat(64)])
      await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', `devtrack_session=${token}`)
        .expect(401);
  });

  it('rejects cross-origin mutations, form submissions, and invalid registration fields', async () => {
    const { user, agent } = await registerTestUser();
    ids.push(user.id);
    await agent
      .post('/api/v1/projects')
      .set('Origin', 'https://attacker.example')
      .send({ name: 'Bad origin' })
      .expect(403);
    await agent
      .delete(`/api/v1/projects/${randomUUID()}`)
      .set('Sec-Fetch-Site', 'cross-site')
      .expect(403);
    await request(app)
      .post('/api/v1/auth/login')
      .type('form')
      .send({ email: user.email, password: testPassword })
      .expect(415);
    for (const body of [
      { name: '', email: 'bad', password: 'short' },
      { name: 'Valid', email: 'good@example.com', password: 'short' },
      {
        name: 'Valid',
        email: 'good@example.com',
        password: testPassword,
        ownerId: user.id,
      },
    ])
      await request(app).post('/api/v1/auth/register').send(body).expect(400);
    const ownOrigin = await agent.get('/api/v1/auth/me').expect(200);
    expect(ownOrigin.headers['cache-control']).toBe('no-store');
  });

  it('rate limits repeated auth requests with a standard JSON error', async () => {
    const limited = express();
    limited.post('/', createAuthRateLimit(2), (_req, res) => {
      res.status(204).end();
    });
    await request(limited).post('/').expect(204);
    await request(limited).post('/').expect(204);
    const response = await request(limited).post('/').expect(429);
    expect(response.body).toMatchObject({ error: { code: 'RATE_LIMITED' } });
    expect(response.headers['retry-after']).toBeDefined();
  });
});
