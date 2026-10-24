import { afterEach, expect, it } from 'vitest';
import { env } from '../../config/env.js';
import { sessionCookieOptions } from './auth.cookie.js';
const original = env.nodeEnv;
afterEach(() => {
  env.nodeEnv = original;
});
it('sets Secure, HttpOnly, SameSite=Lax and a host-only cookie path in production', () => {
  env.nodeEnv = 'production';
  expect(sessionCookieOptions()).toEqual({
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
});
