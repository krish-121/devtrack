import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../logging/logger.js';
import { requestContext } from '../logging/request-context.js';

export function requestLogging(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  // Server-generated identifiers cannot be used to inject arbitrary log text.
  const requestId = randomUUID();
  const started = performance.now();
  const path = request.baseUrl + request.path; // Omit queries, headers and bodies.
  response.setHeader('X-Request-ID', requestId);
  response.locals.requestId = requestId;
  response.once('finish', () => {
    logger.info(
      {
        requestId,
        method: request.method,
        path,
        statusCode: response.statusCode,
        durationMs: Math.round((performance.now() - started) * 100) / 100,
      },
      'API request completed',
    );
  });
  requestContext.run({ requestId }, next);
}
