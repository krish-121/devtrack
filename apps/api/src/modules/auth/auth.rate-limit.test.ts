import express from 'express';
import request from 'supertest';
import { it } from 'vitest';
import { createAuthRateLimit } from './auth.rate-limit.js';

it('keeps proxied clients separate and ignores a spoofed leftmost address', async () => {
  const app = express();
  app.set('trust proxy', 1);
  app.use(createAuthRateLimit(1));
  app.get('/', (_request, response) => response.sendStatus(200));

  await request(app).get('/').set('X-Forwarded-For', '192.0.2.10').expect(200);
  await request(app).get('/').set('X-Forwarded-For', '192.0.2.20').expect(200);
  await request(app)
    .get('/')
    .set('X-Forwarded-For', '198.51.100.99, 192.0.2.10')
    .expect(429);
});
