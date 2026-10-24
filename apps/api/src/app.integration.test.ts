import request from 'supertest';
import { describe, it } from 'vitest';
import { app } from './app.js';

describe('API foundation', () => {
  it('reports liveness without requiring a database', async () => {
    await request(app)
      .get('/api/v1/health')
      .expect('Content-Type', /json/)
      .expect(200, { data: { status: 'ok' } });
  });

  it('returns the standard JSON error for unknown routes', async () => {
    await request(app)
      .get('/api/v1/missing')
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
