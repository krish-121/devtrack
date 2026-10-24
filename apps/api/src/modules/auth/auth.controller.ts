import type { LoginInput, RegisterInput, UserResponse } from '@devtrack/shared';
import type { Request, Response } from 'express';
import type { AuthLocals } from '../../middleware/require-auth.js';
import * as service from './auth.service.js';
import {
  clearSessionCookie,
  readSessionToken,
  setSessionCookie,
} from './auth.cookie.js';

export async function register(
  request: Request,
  response: Response<UserResponse, { body: RegisterInput }>,
) {
  const result = await service.register(
    response.locals.body,
    readSessionToken(request),
  );
  setSessionCookie(response, result.token);
  response.status(201).json({ data: result.user });
}
export async function login(
  request: Request,
  response: Response<UserResponse, { body: LoginInput }>,
) {
  const result = await service.login(
    response.locals.body,
    readSessionToken(request),
  );
  setSessionCookie(response, result.token);
  response.json({ data: result.user });
}
export async function logout(request: Request, response: Response) {
  await service.logout(readSessionToken(request));
  clearSessionCookie(response);
  response.status(204).end();
}
export function me(
  _request: Request,
  response: Response<UserResponse, AuthLocals>,
) {
  response.json({ data: response.locals.user });
}
