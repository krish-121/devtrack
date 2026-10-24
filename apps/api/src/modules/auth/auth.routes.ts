import { Router } from 'express';
import { loginSchema, registerSchema } from '@devtrack/shared';
import { validateBody } from '../../middleware/validate-body.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { createAuthRateLimit } from './auth.rate-limit.js';
import * as controller from './auth.controller.js';

export const authRouter = Router();
const authRateLimit = createAuthRateLimit();
authRouter.post(
  '/register',
  authRateLimit,
  validateBody(registerSchema),
  controller.register,
);
authRouter.post(
  '/login',
  authRateLimit,
  validateBody(loginSchema),
  controller.login,
);
authRouter.post('/logout', controller.logout);
authRouter.get('/me', requireAuth, controller.me);
