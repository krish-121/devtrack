import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env.js';

export function createAuthRateLimit(limit = env.authRateLimitMax) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many sign-in attempts. Please try again later.',
      },
    },
  });
}
