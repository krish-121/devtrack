import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { getSummary } from './dashboard.controller.js';

export const dashboardRouter = Router();
// No request fields to validate: identity comes only from the authenticated session.
dashboardRouter.get('/summary', requireAuth, getSummary);
