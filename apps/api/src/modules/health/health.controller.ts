import type { HealthResponse } from '@devtrack/shared';
import type { Request, Response } from 'express';

export function getHealth(
  _request: Request,
  response: Response<HealthResponse>,
) {
  response.json({ data: { status: 'ok' } });
}
