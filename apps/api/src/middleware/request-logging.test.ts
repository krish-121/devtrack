import express from 'express';
import request from 'supertest';
import { expect, it, vi } from 'vitest';
import { z } from 'zod';
import { logger } from '../logging/logger.js';
import { requestContext } from '../logging/request-context.js';
import { requestLogging } from './request-logging.js';

it('returns a generated request ID and logs status/timing without request secrets', async () => {
  const log = vi.spyOn(logger, 'info').mockImplementation(() => {});
  const app = express();
  app.use(requestLogging);
  app.post('/login', (_request, response) => response.status(401).end());

  const response = await request(app)
    .post('/login?password=query-secret')
    .set('X-Request-ID', 'untrusted-client-value')
    .set('Cookie', 'devtrack_session=cookie-secret')
    .send({ password: 'body-secret' })
    .expect(401);

  const requestId = z.uuid().parse(response.get('X-Request-ID'));
  expect(requestId).toMatch(
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
  );
  expect(log).toHaveBeenCalledWith(
    expect.objectContaining({
      requestId,
      method: 'POST',
      path: '/login',
      statusCode: 401,
    }),
    'API request completed',
  );
  z.object({ durationMs: z.number().nonnegative() }).parse(
    log.mock.calls[0]?.[0],
  );
  expect(JSON.stringify(log.mock.calls)).not.toMatch(/secret|untrusted-client/);
});

it('keeps concurrent asynchronous request contexts separate', async () => {
  vi.spyOn(logger, 'info').mockImplementation(() => {});
  const app = express();
  app.use(requestLogging);
  app.get('/context', async (_request, response) => {
    await new Promise<void>((resolve) => setImmediate(resolve));
    response.json({ requestId: requestContext.getStore()?.requestId });
  });

  const responses = await Promise.all([
    request(app).get('/context').expect(200),
    request(app).get('/context').expect(200),
  ]);
  for (const response of responses)
    expect(response.body).toEqual({
      requestId: z.uuid().parse(response.get('X-Request-ID')),
    });
  expect(responses[0]?.get('X-Request-ID')).not.toBe(
    responses[1]?.get('X-Request-ID'),
  );
  expect(requestContext.getStore()).toBeUndefined();
});
