import type { NextFunction, Request, Response } from 'express';
import type { UserDto } from '@devtrack/shared';
import { authenticate } from '../modules/auth/auth.service.js';
import { readSessionToken } from '../modules/auth/auth.cookie.js';

export type AuthLocals = { ownerId: string; user: UserDto };
export async function requireAuth(
  request: Request,
  response: Response<unknown, AuthLocals>,
  next: NextFunction,
) {
  const user = await authenticate(readSessionToken(request));
  response.locals.ownerId = user.id;
  response.locals.user = user;
  next();
}
