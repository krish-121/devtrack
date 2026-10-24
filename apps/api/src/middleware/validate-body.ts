import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';

export function validateBody<T>(schema: z.ZodType<T>) {
  return (
    request: Request<Record<string, string>, unknown, unknown>,
    response: Response<unknown, { body: T }>,
    next: NextFunction,
  ) => {
    response.locals.body = schema.parse(request.body);
    next();
  };
}
