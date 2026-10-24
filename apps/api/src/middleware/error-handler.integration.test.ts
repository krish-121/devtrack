import express from 'express';
import request from 'supertest';
import { expect, it, vi } from 'vitest';
import { logger } from '../logging/logger.js';
import { errorHandler } from './error-handler.js';

it('logs unexpected failures and returns a generic error without internal details', async () => {
  const logError = vi.spyOn(logger, 'error').mockImplementation(() => {});
  const failingApp = express();
  const error = new Error('Internal implementation detail');

  failingApp.get('/failure', () => {
    throw error;
  });
  failingApp.use(errorHandler);

  await request(failingApp)
    .get('/failure')
    .expect('Content-Type', /json/)
    .expect(500, {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred.',
      },
    });

  expect(logError).toHaveBeenCalledWith(
    { err: error },
    'Unhandled request error',
  );
});

it('does not log query arguments from unexpected Prisma failures', async () => {
  const logError = vi.spyOn(logger, 'error').mockImplementation(() => {});
  const failingApp = express();
  const error = new Error(
    'Query arguments: passwordHash=private-hash tokenHash=private-token',
  );
  error.name = 'PrismaClientValidationError';
  failingApp.get('/failure', () => {
    throw error;
  });
  failingApp.use(errorHandler);
  await request(failingApp).get('/failure').expect(500);
  expect(logError).toHaveBeenCalledWith(
    { err: { name: 'PrismaClientValidationError' } },
    'Unhandled database error',
  );
});
