import type { ApiErrorResponse } from '@devtrack/shared';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../logging/logger.js';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response<ApiErrorResponse>,
  next: NextFunction,
) {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const issue of error.issues) {
      const field = issue.path.join('.') || 'body';
      details[field] ??= issue.message;
    }
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request contains invalid fields.',
        details,
      },
    });
    return;
  }
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }
  if (
    error instanceof Error &&
    'type' in error &&
    (error.type === 'entity.parse.failed' || error.type === 'entity.too.large')
  ) {
    const tooLarge = error.type === 'entity.too.large';
    response.status(tooLarge ? 413 : 400).json({
      error: {
        code: tooLarge ? 'PAYLOAD_TOO_LARGE' : 'INVALID_JSON',
        message: tooLarge
          ? 'Request body is too large.'
          : 'Request body must be valid JSON.',
      },
    });
    return;
  }
  // Prisma errors can embed query arguments in their message, including an auth
  // hash or session token hash. Keep only their name/code in application logs.
  if (error instanceof Error && error.name.startsWith('PrismaClient')) {
    logger.error(
      {
        err: {
          name: error.name,
          ...('code' in error && typeof error.code === 'string'
            ? { code: error.code }
            : {}),
        },
      },
      'Unhandled database error',
    );
  } else {
    logger.error({ err: error }, 'Unhandled request error');
  }
  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
}
