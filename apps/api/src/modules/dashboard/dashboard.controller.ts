import type { DashboardResponse } from '@devtrack/shared';
import type { Request, Response } from 'express';
import type { AuthLocals } from '../../middleware/require-auth.js';
import { getDashboardSummary } from './dashboard.service.js';

export async function getSummary(
  _request: Request,
  response: Response<DashboardResponse, AuthLocals>,
) {
  response.json({ data: await getDashboardSummary(response.locals.ownerId) });
}
