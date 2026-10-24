import { parse } from 'cookie';
import type { Request, Response, CookieOptions } from 'express';
import { env } from '../../config/env.js';
import { sessionLifetimeMs } from './auth.service.js';

export const authCookieName = 'devtrack_session';
export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
  };
}
export function readSessionToken(request: Request): string | undefined {
  const token = parse(request.headers.cookie ?? '')[authCookieName];
  return token && /^[a-f0-9]{64}$/.test(token) ? token : undefined;
}
export function setSessionCookie(response: Response, token: string) {
  response.cookie(authCookieName, token, {
    ...sessionCookieOptions(),
    maxAge: sessionLifetimeMs,
  });
}
export function clearSessionCookie(response: Response) {
  response.clearCookie(authCookieName, sessionCookieOptions());
}
