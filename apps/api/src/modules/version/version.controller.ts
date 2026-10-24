import type { VersionResponse } from '@devtrack/shared';
import type { Request, Response } from 'express';
import { env } from '../../config/env.js';

export function getVersion(
  _request: Request,
  response: Response<VersionResponse>,
) {
  response.setHeader('Cache-Control', 'no-store');
  response.json({ data: { version: env.appVersion } });
}
