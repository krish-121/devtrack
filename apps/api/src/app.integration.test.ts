import request from 'supertest';
import { describe, it } from 'vitest';
import { app } from './app.js';
import { env } from './config/env.js';

describe('API foundation', () => {
  it('reports liveness without requiring a database', async () => {
    await request(app)
      .get('/api/v1/health')
      .expect('X-Request-ID', /^[a-f0-9-]{36}$/)
      .expect('Content-Type', /json/)
      .expect(200, { data: { status: 'ok' } });
  });

  it('reports the deployed version without exposing configuration or caching it', async () => {
    await request(app)
      .get('/api/v1/version')
      .expect('Cache-Control', 'no-store')
      .expect('Content-Type', /json/)
      .expect(200, { data: { version: env.appVersion } });
  });

  it('returns the standard JSON error for unknown routes', async () => {
    await request(app)
      .get('/api/v1/missing')
      .expect('X-Request-ID', /^[a-f0-9-]{36}$/)
      .expect('Content-Type', /json/)
      .expect(404, {
        error: { code: 'NOT_FOUND', message: 'Route not found.' },
      });
  });

  it('does not accept a write operation at the health endpoint', async () => {
    await request(app)
      .post('/api/v1/health')
      .expect(404, {
        error: { code: 'NOT_FOUND', message: 'Route not found.' },
      });
  });
});
