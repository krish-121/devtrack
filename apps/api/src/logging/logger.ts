import pino from 'pino';
import { env } from '../config/env.js';
import { requestContext } from './request-context.js';

export const logger = pino({
  level: env.logLevel,
  mixin: () => requestContext.getStore() ?? {},
});
